class UploadImageForm
    include ActiveModel::Model
    include ActiveModel::Attributes
  
    attribute :store_id
    attribute :folder_id
    attribute :attached_file
  
    validates_presence_of :folder_id
    validates_presence_of :attached_file
  
    validate :valid_folder
  
    def save
      return false if invalid?
  
      gallery_name = attached_file&.original_filename.to_s
  
      gallery = Gallery.new(name: gallery_name,
                            attached_file:,
                            gallery_folder_id: folder_id.to_i,
                            store_id:)
  
      return [true, gallery.id] if gallery.save
  
      errors.merge!(gallery.errors)
  
      [false, nil]
    end
  
    private
  
    def valid_folder
      folder = GalleryFolder.find_by(id: folder_id)
  
      errors.add(:folder_id, :invalid) unless folder.present?
    end
  end
  