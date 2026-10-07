output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "client_ecr_repository" {
  value = aws_ecr_repository.client.repository_url
}

output "server_ecr_repository" {
  value = aws_ecr_repository.server.repository_url
}

output "vpc_id" {
  value = module.vpc.vpc_id
}
