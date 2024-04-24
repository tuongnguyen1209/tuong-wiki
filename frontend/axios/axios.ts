/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { API_ENDPOINT } from "global/config";
import { API_ROUTES } from "global/constants";
import { RESPONSE_CODES } from "global/constants/codes";
import { APIResponse } from "interface/APIResponse";
import {
  refreshTokenAction,
  resetAuth,
  signOutAction,
} from "modules/redux/slices/authSlice";
import store from "modules/redux/store";

function isAccessTokenExpired(code?: string) {
  return code === RESPONSE_CODES.unauthorized.access_token.expired;
}

function isAccessTokenInvalid(code?: string) {
  return code === RESPONSE_CODES.unauthorized.access_token.invalid;
}

function isInvalidTerminal(code?: string) {
  const { accessToken } = store.getState().auth;

  return (
    code === RESPONSE_CODES.unauthorized.login.invalid_terminal && accessToken
  );
}

let isRefreshing = false;
type FailedQueue = {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
};
let failedQueue: FailedQueue[] = [];

function processQueue(error: AxiosError | Error | null, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

function createAxiosClient(contentType: string): AxiosInstance {
  const axiosClient = axios.create({
    baseURL: API_ENDPOINT,
    headers: { "Content-Type": contentType },
  });

  axiosClient.interceptors.request.use(async (config) => {
    const { accessToken } = store.getState().auth;
    if (config.headers) {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  axiosClient.interceptors.response.use(
    (response) => response.data,
    async (error: AxiosError<APIResponse>) => {
      const originalRequest =
        error.config as InternalAxiosRequestConfig<unknown>;
      const code = error.response?.data?.code;

      if (isAccessTokenInvalid(code) || isInvalidTerminal(code)) {
        store.dispatch(resetAuth());
        return;
      }

      if (isAccessTokenExpired(code)) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;
        const { refreshToken, session_id } = store.getState().auth;

        return new Promise((resolve, reject) => {
          store
            .dispatch(
              refreshTokenAction({ refresh_token: refreshToken, session_id })
            )
            .unwrap()
            .then((data) => {
              if (!data) {
                isRefreshing = false;

                resolve(undefined);
              } else {
                if (
                  data?.code ===
                  RESPONSE_CODES.unauthorized.refresh_token.invalid
                ) {
                  store.dispatch(
                    signOutAction({ refresh_token: refreshToken })
                  );
                  resolve(undefined);
                  return;
                }

                const newAccessToken = data?.data?.access_token;
                const newRefreshToken = data?.data?.refresh_token;

                axios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
                if (originalRequest.headers)
                  originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                if (originalRequest.url === API_ROUTES.logout)
                  originalRequest.data = JSON.stringify({
                    refresh_token: newRefreshToken,
                  });
                processQueue(null, newAccessToken);
                resolve(axiosClient(originalRequest));
              }
            })
            .catch((err) => {
              if (axios.isAxiosError(err) || err instanceof Error)
                processQueue(err, null);
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }
      return error.response?.data;
    }
  );
  return axiosClient;
}

export const axiosClientMultipartFormData = createAxiosClient(
  "multipart/form-data"
);

export default createAxiosClient("application/json");
