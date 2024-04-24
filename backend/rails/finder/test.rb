class ComboFinder < ApplicationFinder
    model MenuItemCombo
  
    attribute :master_item_id
    attribute :combo_price
    attribute :combo_variant_value
    attribute :combo_variant_type
    attribute :related_master_item_id
  
    rule :combo_discover
  
    def combo_discover
      result = model.where(related_master_item_id:, master_item_id:, combo_price:)
  
      return nil unless result.present?
  
      search_for_correct_combo(result)
    end
  
    def search_for_correct_combo(result)
      variant_value = VariantValue.find_by(name: combo_variant_value.to_s, variant_type_id: combo_variant_type.to_i)
  
      item_variant = ItemVariant.find_by(master_item_id: related_master_item_id, variant_value_id: variant_value.id)
  
      result.find_by(item_variant_id: item_variant.id).presence
    end
  end
  