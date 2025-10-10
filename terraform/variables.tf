variable "location" {
  description = "Azure region for deployment"
  type        = string
  default     = "centralIndia"
}
variable "client_id" {
  type = string
}

variable "client_secret" {
  type = string
  sensitive = true
}

variable "tenant_id" {
  type = string
}

variable "subscription_id" {
  type = string
}
