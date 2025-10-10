# Resource Group
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.ems.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.ems.location
}

# App Service Plan
output "app_service_plan_name" {
  description = "Name of the App Service Plan"
  value       = azurerm_app_service_plan.ems_plan.name
}

output "app_service_plan_tier" {
  description = "Pricing tier of the App Service Plan"
  value       = azurerm_app_service_plan.ems_plan.sku[0].tier
}

# Web App
output "web_app_name" {
  description = "Name of the Web App"
  value       = azurerm_app_service.ems_web.name
}

output "web_app_default_hostname" {
  description = "Default hostname of the Web App"
  value       = azurerm_app_service.ems_web.default_site_hostname
}

# Storage Account
output "storage_account_name" {
  description = "Name of the Storage Account"
  value       = azurerm_storage_account.ems_storage.name
}

output "storage_account_primary_endpoint" {
  description = "Primary blob endpoint of the Storage Account"
  value       = azurerm_storage_account.ems_storage.primary_blob_endpoint
}

# Storage Container
output "storage_container_name" {
  description = "Name of the Blob Container"
  value       = azurerm_storage_container.media.name
}
