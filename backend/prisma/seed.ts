import {
  PrismaClient,
  UserRole,
  ShiftType,
  ShiftStatus,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  IncidentSource,
  AlertSeverity,
  AlertStatus,
  TaskStatus,
  TaskPriority,
  AnnouncementPriority,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  getPreviousShiftWindow,
  getShiftWindow,
  getNextShiftWindow,
  getCurrentShiftType,
  SHIFT_SCHEDULE,
} from '../src/utils/shiftSchedule';

const prisma = new PrismaClient();

const PASSWORD = 'password123';

async function main() {
  console.log('Seeding ShiftSync database...');

  await prisma.incidentNote.deleteMany();
  await prisma.shiftSummary.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.task.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'Paula Waiter',
        email: 'paula.waiter@shiftsync.local',
        passwordHash,
        role: UserRole.OPERATOR,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Ronny Binya',
        email: 'ronny.binya@shiftsync.local',
        passwordHash,
        role: UserRole.OPERATOR,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Olya Vygodina',
        email: 'olya.vygodina@shiftsync.local',
        passwordHash,
        role: UserRole.OPERATOR,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Rachel Green',
        email: 'rachel.green@shiftsync.local',
        passwordHash,
        role: UserRole.SHIFT_MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: 'admin@shiftsync.local',
        passwordHash,
        role: UserRole.ADMIN,
      },
    }),
  ]);

  const [paula, ronny, olya, rachel, admin] = users;

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const previousShift = getPreviousShiftWindow(now);
  const currentShiftType = getCurrentShiftType(now);
  const { start: activeStart, end: activeEnd } = getShiftWindow(currentShiftType, now);
  const nextShift = getNextShiftWindow(now);

  const completedNightShift = await prisma.shift.create({
    data: {
      shiftType: previousShift.type,
      startTime: previousShift.start,
      endTime: previousShift.end,
      responsibleId: olya.id,
      status: ShiftStatus.COMPLETED,
      handoverNotes:
        'Cluster 12 had intermittent server timeouts. DB latency spike resolved after index rebuild. Firewall rule change pending validation by morning shift.',
    },
  });

  const activeMorningShift = await prisma.shift.create({
    data: {
      shiftType: currentShiftType,
      startTime: activeStart,
      endTime: activeEnd,
      responsibleId: paula.id,
      status: ShiftStatus.ACTIVE,
      handoverNotes:
        'Taking over from night shift. Monitoring payment service latency and reviewing firewall update status.',
    },
  });

  const plannedAfternoonShift = await prisma.shift.create({
    data: {
      shiftType: nextShift.type,
      startTime: nextShift.start,
      endTime: nextShift.end,
      responsibleId: ronny.id,
      status: ShiftStatus.PLANNED,
    },
  });

  const incidentsData = [
    {
      title: 'High latency on payment service',
      description:
        'API response times exceeded 2s threshold for /payments/process endpoint. Affecting checkout flow.',
      category: IncidentCategory.APPLICATION,
      severity: IncidentSeverity.CRITICAL,
      status: IncidentStatus.INVESTIGATING,
      relatedService: 'payment-service',
      assignedUserId: paula.id,
      shiftId: activeMorningShift.id,
      source: IncidentSource.MONITORING,
    },
    {
      title: 'Database connection pool exhaustion',
      description:
        'Primary DB cluster reporting connection pool at 95% capacity. Read replicas healthy.',
      category: IncidentCategory.DATABASE,
      severity: IncidentSeverity.HIGH,
      status: IncidentStatus.OPEN,
      relatedService: 'postgres-primary',
      assignedUserId: ronny.id,
      shiftId: activeMorningShift.id,
      source: IncidentSource.MONITORING,
    },
    {
      title: 'Failed login spike detected',
      description:
        'Authentication service showing 3x normal failed login rate from EU region IPs.',
      category: IncidentCategory.SECURITY,
      severity: IncidentSeverity.HIGH,
      status: IncidentStatus.INVESTIGATING,
      relatedService: 'auth-service',
      assignedUserId: paula.id,
      shiftId: activeMorningShift.id,
      source: IncidentSource.MONITORING,
    },
    {
      title: 'CPU usage above threshold on app-server-03',
      description: 'Sustained CPU at 92% for 15 minutes. Auto-scaling triggered but lag observed.',
      category: IncidentCategory.INFRASTRUCTURE,
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.OPEN,
      relatedService: 'app-server-03',
      assignedUserId: olya.id,
      shiftId: completedNightShift.id,
      source: IncidentSource.MONITORING,
    },
    {
      title: 'Queue processing delay in order pipeline',
      description: 'RabbitMQ order queue backlog reached 12,000 messages. Consumers scaled to 8.',
      category: IncidentCategory.APPLICATION,
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.RESOLVED,
      relatedService: 'order-queue',
      assignedUserId: olya.id,
      shiftId: completedNightShift.id,
      source: IncidentSource.MONITORING,
      resolvedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      title: 'VPN gateway intermittent disconnects',
      description: 'Remote NOC engineers reporting VPN drops every 20-30 minutes.',
      category: IncidentCategory.NETWORK,
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.OPEN,
      relatedService: 'vpn-gateway',
      assignedUserId: ronny.id,
      shiftId: activeMorningShift.id,
      source: IncidentSource.MANUAL,
    },
    {
      title: 'SSL certificate expiring in 7 days',
      description: 'api.internal.company.com certificate expires May 25. Renewal ticket opened.',
      category: IncidentCategory.SECURITY,
      severity: IncidentSeverity.LOW,
      status: IncidentStatus.OPEN,
      relatedService: 'api-gateway',
      assignedUserId: rachel.id,
      shiftId: activeMorningShift.id,
      source: IncidentSource.MANUAL,
    },
    {
      title: 'Monitoring agent offline on cache-node-02',
      description: 'Prometheus scrape failures for cache-node-02. Node may be unreachable.',
      category: IncidentCategory.INFRASTRUCTURE,
      severity: IncidentSeverity.LOW,
      status: IncidentStatus.CLOSED,
      relatedService: 'cache-node-02',
      assignedUserId: olya.id,
      shiftId: completedNightShift.id,
      source: IncidentSource.MONITORING,
      resolvedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  ];

  const incidents = await Promise.all(
    incidentsData.map((data) => prisma.incident.create({ data }))
  );

  const alertsData = [
    {
      title: 'High latency detected in payment service',
      description: 'P95 latency 2.4s on /payments/process (threshold: 1.5s)',
      service: 'payment-service',
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.CONVERTED_TO_INCIDENT,
      sourceSystem: 'Datadog',
      shiftId: activeMorningShift.id,
      incidentId: incidents[0].id,
    },
    {
      title: 'Database connection errors',
      description: 'Connection refused errors spiking on postgres-primary',
      service: 'postgres-primary',
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.CONVERTED_TO_INCIDENT,
      sourceSystem: 'Prometheus',
      shiftId: activeMorningShift.id,
      incidentId: incidents[1].id,
    },
    {
      title: 'CPU usage above threshold',
      description: 'CPU > 90% for 10+ minutes on app-server-03',
      service: 'app-server-03',
      severity: AlertSeverity.WARNING,
      status: AlertStatus.ACKNOWLEDGED,
      sourceSystem: 'Grafana',
      shiftId: completedNightShift.id,
    },
    {
      title: 'Failed login spike',
      description: 'Failed auth attempts 300% above baseline',
      service: 'auth-service',
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.CONVERTED_TO_INCIDENT,
      sourceSystem: 'SIEM',
      shiftId: activeMorningShift.id,
      incidentId: incidents[2].id,
    },
    {
      title: 'API response time degradation',
      description: 'User API P99 latency increased to 890ms',
      service: 'user-api',
      severity: AlertSeverity.WARNING,
      status: AlertStatus.NEW,
      sourceSystem: 'Datadog',
      shiftId: activeMorningShift.id,
    },
    {
      title: 'Queue processing delay',
      description: 'order-queue depth > 10,000 messages',
      service: 'order-queue',
      severity: AlertSeverity.WARNING,
      status: AlertStatus.DISMISSED,
      sourceSystem: 'RabbitMQ Exporter',
      shiftId: completedNightShift.id,
    },
    {
      title: 'Disk space low on log-aggregator',
      description: '/var/log partition at 87% capacity',
      service: 'log-aggregator',
      severity: AlertSeverity.WARNING,
      status: AlertStatus.NEW,
      sourceSystem: 'Prometheus',
      shiftId: activeMorningShift.id,
    },
    {
      title: 'Memory pressure on redis-cluster',
      description: 'Redis memory usage at 82%, eviction policy active',
      service: 'redis-cluster',
      severity: AlertSeverity.INFO,
      status: AlertStatus.ACKNOWLEDGED,
      sourceSystem: 'Redis Exporter',
      shiftId: activeMorningShift.id,
    },
    {
      title: 'Health check failure on load-balancer-02',
      description: '2 of 8 backend targets unhealthy',
      service: 'load-balancer-02',
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.NEW,
      sourceSystem: 'AWS CloudWatch',
      shiftId: activeMorningShift.id,
    },
    {
      title: 'Certificate expiry warning',
      description: 'TLS cert for api.internal expires in 7 days',
      service: 'api-gateway',
      severity: AlertSeverity.INFO,
      status: AlertStatus.ACKNOWLEDGED,
      sourceSystem: 'Cert Manager',
      shiftId: activeMorningShift.id,
    },
  ];

  await Promise.all(alertsData.map((data) => prisma.alert.create({ data })));

  const tasksData = [
    {
      title: 'Review server logs for Cluster 12 timeouts',
      description: 'Pull and analyze logs from app-server-01 through app-server-04 for timeout patterns.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignedUserId: paula.id,
      shiftId: activeMorningShift.id,
      dueDate: new Date(now.getTime() + dayMs),
    },
    {
      title: 'Analyze database server latency metrics',
      description: 'Compare query performance before and after index rebuild on orders table.',
      status: TaskStatus.OPEN,
      priority: TaskPriority.HIGH,
      assignedUserId: ronny.id,
      shiftId: activeMorningShift.id,
      dueDate: new Date(now.getTime() + dayMs),
    },
    {
      title: 'Test new firewall rules in staging',
      description: 'Validate outbound rule changes before production rollout.',
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
      assignedUserId: paula.id,
      shiftId: activeMorningShift.id,
    },
    {
      title: 'Follow up on INC payment service latency',
      description: 'Coordinate with application team on root cause analysis.',
      status: TaskStatus.OPEN,
      priority: TaskPriority.HIGH,
      assignedUserId: paula.id,
      shiftId: activeMorningShift.id,
    },
    {
      title: 'Renew SSL certificate for api.internal',
      description: 'Submit renewal request and schedule deployment window.',
      status: TaskStatus.OPEN,
      priority: TaskPriority.LOW,
      assignedUserId: rachel.id,
      shiftId: activeMorningShift.id,
      dueDate: new Date(now.getTime() + 5 * dayMs),
    },
    {
      title: 'Document night shift handover items',
      description: 'Update runbook with Cluster 12 findings.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assignedUserId: olya.id,
      shiftId: completedNightShift.id,
    },
    {
      title: 'Scale order queue consumers',
      description: 'Increased consumers from 4 to 8. Monitor backlog reduction.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assignedUserId: olya.id,
      shiftId: completedNightShift.id,
    },
    {
      title: 'Investigate VPN disconnect reports',
      description: 'Gather packet captures from affected remote engineers.',
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
      assignedUserId: ronny.id,
      shiftId: activeMorningShift.id,
    },
  ];

  await Promise.all(tasksData.map((data) => prisma.task.create({ data })));

  await Promise.all([
    prisma.announcement.create({
      data: {
        title: 'Critical Update: Urgent Procedure Adjustment',
        content: `All NOC engineers must review the updated escalation procedure for critical incidents.

Key changes:
- Critical incidents must be escalated to Shift Manager within 15 minutes
- Payment service incidents require immediate notification to on-call app team
- New PagerDuty integration for after-hours escalations

Please acknowledge this announcement before end of shift.`,
        priority: AnnouncementPriority.URGENT,
        createdBy: rachel.id,
      },
    }),
    prisma.announcement.create({
      data: {
        title: 'Reminder: New VPN Configuration Rollout',
        content:
          'VPN client v3.2 will be deployed to all remote NOC workstations this week. Please schedule updates during low-traffic windows.',
        priority: AnnouncementPriority.IMPORTANT,
        createdBy: rachel.id,
        expiresAt: new Date(now.getTime() + 14 * dayMs),
      },
    }),
    prisma.announcement.create({
      data: {
        title: 'Post-Shift Cleanup Guidelines',
        content:
          'Remember to clear personal notes from shared dashboards and ensure all open incidents have assigned owners before completing handover.',
        priority: AnnouncementPriority.NORMAL,
        createdBy: admin.id,
      },
    }),
  ]);

  await prisma.incidentNote.createMany({
    data: [
      {
        incidentId: incidents[0].id,
        authorId: paula.id,
        content:
          'Contacted payment team. They identified a slow query on transaction ledger. Index being added.',
      },
      {
        incidentId: incidents[1].id,
        authorId: ronny.id,
        content: 'Increased connection pool size from 100 to 150. Monitoring for stability.',
      },
      {
        incidentId: incidents[2].id,
        authorId: paula.id,
        content: 'Blocked suspicious IP range 185.220.x.x at firewall level.',
      },
    ],
  });

  await prisma.shiftSummary.create({
    data: {
      shiftId: completedNightShift.id,
      generatedByAI: true,
      generatedText: `## Shift Overview
Night shift (${SHIFT_SCHEDULE.NIGHT.label}) operated by Olya Vygodina completed with moderate operational activity.

## Critical Incidents
- **Queue processing delay**: Order pipeline backlog reached 12,000 messages. Resolved by scaling consumers from 4 to 8.

## Open Issues
- CPU usage on app-server-03 remains elevated (92%). Requires morning shift follow-up.
- Monitoring agent on cache-node-02 was offline; node connectivity restored.

## Resolved Issues
- Order queue backlog cleared. Processing returned to normal within 2 hours.
- Cache-node-02 monitoring restored after node reboot.

## Tasks for Next Shift
- Review Cluster 12 server timeout logs
- Continue monitoring database latency trends
- Validate firewall rule changes in staging

## Recommended Follow-up Actions
1. Investigate root cause of app-server-03 CPU spike
2. Complete firewall rule validation before production deployment
3. Update runbook with Cluster 12 timeout investigation notes`,
    },
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Demo login credentials (all users):');
  console.log(`  Password: ${PASSWORD}`);
  console.log('  Emails:');
  users.forEach((u) => console.log(`    - ${u.email} (${u.role})`));
  console.log('');
  console.log(`Created: ${users.length} users, 3 shifts, ${incidents.length} incidents, 10 alerts, 8 tasks, 3 announcements, 1 summary`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
