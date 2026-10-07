variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "trendz"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "trendz-cluster"
}
