export type Ingress = {
  domain: string
  port: number
  service: string
  insecure?: boolean
  protocol?: 'http' | 'https'
}
