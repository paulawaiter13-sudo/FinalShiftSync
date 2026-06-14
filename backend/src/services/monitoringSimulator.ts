import { AlertSeverity } from '@prisma/client';

export interface MockAlertTemplate {
  title: string;
  description: string;
  service: string;
  severity: AlertSeverity;
  sourceSystem: string;
}

export const MOCK_ALERT_TEMPLATES: MockAlertTemplate[] = [
  {
    title: 'High latency detected in payment service',
    description: 'P95 latency exceeded 1.5s threshold on /payments/process endpoint.',
    service: 'payment-service',
    severity: AlertSeverity.CRITICAL,
    sourceSystem: 'Datadog',
  },
  {
    title: 'Database connection errors',
    description: 'Connection refused errors spiking on postgres-primary cluster.',
    service: 'postgres-primary',
    severity: AlertSeverity.CRITICAL,
    sourceSystem: 'Prometheus',
  },
  {
    title: 'CPU usage above threshold',
    description: 'CPU utilization above 90% for more than 10 minutes on app-server-03.',
    service: 'app-server-03',
    severity: AlertSeverity.WARNING,
    sourceSystem: 'Grafana',
  },
  {
    title: 'Failed login spike',
    description: 'Failed authentication attempts 300% above baseline in EU region.',
    service: 'auth-service',
    severity: AlertSeverity.CRITICAL,
    sourceSystem: 'SIEM',
  },
  {
    title: 'API response time degradation',
    description: 'User API P99 latency increased to 890ms (threshold: 500ms).',
    service: 'user-api',
    severity: AlertSeverity.WARNING,
    sourceSystem: 'Datadog',
  },
  {
    title: 'Queue processing delay',
    description: 'Order queue depth exceeded 10,000 messages with slow consumer rate.',
    service: 'order-queue',
    severity: AlertSeverity.WARNING,
    sourceSystem: 'RabbitMQ Exporter',
  },
  {
    title: 'Disk space low on log-aggregator',
    description: '/var/log partition at 87% capacity on log-aggregator-01.',
    service: 'log-aggregator',
    severity: AlertSeverity.WARNING,
    sourceSystem: 'Prometheus',
  },
  {
    title: 'Memory pressure on redis-cluster',
    description: 'Redis memory usage at 82% with active eviction policy.',
    service: 'redis-cluster',
    severity: AlertSeverity.INFO,
    sourceSystem: 'Redis Exporter',
  },
  {
    title: 'Health check failure on load-balancer',
    description: '2 of 8 backend targets reporting unhealthy status.',
    service: 'load-balancer-02',
    severity: AlertSeverity.CRITICAL,
    sourceSystem: 'AWS CloudWatch',
  },
  {
    title: 'Certificate expiry warning',
    description: 'TLS certificate for api.internal expires within 7 days.',
    service: 'api-gateway',
    severity: AlertSeverity.INFO,
    sourceSystem: 'Cert Manager',
  },
  {
    title: 'SSL handshake failures',
    description: 'Intermittent SSL handshake errors on edge proxy nodes.',
    service: 'edge-proxy',
    severity: AlertSeverity.WARNING,
    sourceSystem: 'NGINX Exporter',
  },
  {
    title: 'Kubernetes pod restart loop',
    description: 'Pod notification-worker restarting repeatedly in production namespace.',
    service: 'k8s-notification-worker',
    severity: AlertSeverity.CRITICAL,
    sourceSystem: 'Kubernetes',
  },
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateMockAlerts(count = 1): MockAlertTemplate[] {
  const shuffled = [...MOCK_ALERT_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((template) => ({
    ...template,
    description: `${template.description} [Simulated at ${new Date().toISOString()}]`,
  }));
}

export function alertSeverityToIncidentSeverity(
  severity: AlertSeverity
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return 'CRITICAL';
    case AlertSeverity.WARNING:
      return 'HIGH';
    case AlertSeverity.INFO:
    default:
      return 'MEDIUM';
  }
}

export function inferCategoryFromService(service: string): string {
  const s = service.toLowerCase();
  if (s.includes('postgres') || s.includes('redis') || s.includes('database')) {
    return 'DATABASE';
  }
  if (s.includes('auth') || s.includes('cert') || s.includes('ssl')) {
    return 'SECURITY';
  }
  if (s.includes('lb') || s.includes('load-balancer') || s.includes('proxy') || s.includes('vpn')) {
    return 'NETWORK';
  }
  if (s.includes('server') || s.includes('k8s') || s.includes('cpu') || s.includes('disk')) {
    return 'INFRASTRUCTURE';
  }
  return 'APPLICATION';
}

export { pickRandom };
