class PresignedFileUrlService < ApplicationService
  private

  def initialize(file_path, file_name); end

  def call; end

  # Recheck file url response from s3
  def recheck_url(url); end
end
