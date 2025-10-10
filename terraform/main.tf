provider "azurerm" {
  features {}

  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
  subscription_id = var.subscription_id
}
  

# Resource Group
resource "azurerm_resource_group" "ems" {
  name     = "rg-ems-central-india"
  location = var.location
}

# App Service Plan (Premium v2)
resource "azurerm_app_service_plan" "ems_plan" {
  name                = "asp-ems-premiumv2"
  location            = azurerm_resource_group.ems.location
  resource_group_name = azurerm_resource_group.ems.name
  sku {
    tier = "Standard"
    size = "S1"
  }
  maximum_elastic_worker_count = 3
}

# Web App for Frontend + API
resource "azurerm_app_service" "ems_web" {
  name                = "webapp-ems"
  location            = azurerm_resource_group.ems.location
  resource_group_name = azurerm_resource_group.ems.name
  app_service_plan_id = azurerm_app_service_plan.ems_plan.id

  site_config {
    always_on = true
    ftps_state = "Disabled"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    environment = "dev"
    project     = "ems"
  }
}


# Blob Storage (GRS)
resource "azurerm_storage_account" "ems_storage" {
  name                     = "emsstoragedev001"
  resource_group_name      = azurerm_resource_group.ems.name
  location                 = azurerm_resource_group.ems.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  access_tier              = "Hot"

  blob_properties {
    delete_retention_policy {
      days = 7
    }
  }

  tags = {
    environment = "dev"
    project     = "ems"
  }
}

# Blob Container for media
resource "azurerm_storage_container" "media" {
  name                  = "eventmedia"
  storage_account_name  = azurerm_storage_account.ems_storage.name
  container_access_type = "private"
}
