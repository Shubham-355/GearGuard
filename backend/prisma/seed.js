const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean up existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning up existing data...');
  await prisma.maintenanceRequest.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.maintenanceTeam.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();

  // Create a demo company
  console.log('🏢 Creating demo company...');
  const company = await prisma.company.create({
    data: {
      name: 'ACME Manufacturing',
      allowedDomains: ['@acme.com', '@acme.co.in'],
      inviteCode: 'GG-ACME-1234',
    },
  });

  // Create departments
  console.log('🏛️ Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Production',
        description: 'Manufacturing and production department',
        companyId: company.id,
      },
    }),
    prisma.department.create({
      data: {
        name: 'IT',
        description: 'Information Technology department',
        companyId: company.id,
      },
    }),
    prisma.department.create({
      data: {
        name: 'Logistics',
        description: 'Warehouse and logistics department',
        companyId: company.id,
      },
    }),
    prisma.department.create({
      data: {
        name: 'Administration',
        description: 'Administrative department',
        companyId: company.id,
      },
    }),
  ]);

  const [productionDept, itDept, logisticsDept, adminDept] = departments;

  // Create users with hashed passwords
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        name: 'John Admin',
        email: 'admin@acme.com',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id,
        departmentId: adminDept.id,
      },
    }),
    // Maintenance Manager
    prisma.user.create({
      data: {
        name: 'Sarah Manager',
        email: 'manager@acme.com',
        password: hashedPassword,
        role: 'MAINTENANCE_MANAGER',
        companyId: company.id,
        departmentId: productionDept.id,
      },
    }),
    // Technicians
    prisma.user.create({
      data: {
        name: 'Mike Mechanic',
        email: 'mike@acme.com',
        password: hashedPassword,
        role: 'TECHNICIAN',
        companyId: company.id,
        departmentId: productionDept.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Lisa Electrician',
        email: 'lisa@acme.com',
        password: hashedPassword,
        role: 'TECHNICIAN',
        companyId: company.id,
        departmentId: productionDept.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Tom IT Tech',
        email: 'tom@acme.com',
        password: hashedPassword,
        role: 'TECHNICIAN',
        companyId: company.id,
        departmentId: itDept.id,
      },
    }),
    // Employees
    prisma.user.create({
      data: {
        name: 'Alice Employee',
        email: 'alice@acme.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        companyId: company.id,
        departmentId: productionDept.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Employee',
        email: 'bob@acme.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        companyId: company.id,
        departmentId: logisticsDept.id,
      },
    }),
  ]);

  const [admin, manager, mikeTech, lisaTech, tomTech, aliceEmployee, bobEmployee] = users;

  // Create maintenance teams
  console.log('👷 Creating maintenance teams...');
  const teams = await Promise.all([
    prisma.maintenanceTeam.create({
      data: {
        name: 'Mechanics',
        description: 'Mechanical equipment maintenance team',
        companyId: company.id,
      },
    }),
    prisma.maintenanceTeam.create({
      data: {
        name: 'Electricians',
        description: 'Electrical systems maintenance team',
        companyId: company.id,
      },
    }),
    prisma.maintenanceTeam.create({
      data: {
        name: 'IT Support',
        description: 'IT equipment and systems support',
        companyId: company.id,
      },
    }),
  ]);

  const [mechanicsTeam, electriciansTeam, itTeam] = teams;

  // Add team members
  console.log('👥 Adding team members...');
  await Promise.all([
    // Mechanics team
    prisma.teamMember.create({
      data: { userId: manager.id, teamId: mechanicsTeam.id, isLead: true },
    }),
    prisma.teamMember.create({
      data: { userId: mikeTech.id, teamId: mechanicsTeam.id, isLead: false },
    }),
    // Electricians team
    prisma.teamMember.create({
      data: { userId: manager.id, teamId: electriciansTeam.id, isLead: true },
    }),
    prisma.teamMember.create({
      data: { userId: lisaTech.id, teamId: electriciansTeam.id, isLead: false },
    }),
    // IT team
    prisma.teamMember.create({
      data: { userId: tomTech.id, teamId: itTeam.id, isLead: true },
    }),
  ]);

  // Create equipment categories
  console.log('📁 Creating equipment categories...');
  const categories = await Promise.all([
    prisma.equipmentCategory.create({
      data: {
        name: 'CNC Machines',
        description: 'Computer Numerical Control machines',
        companyId: company.id,
        responsibleDeptId: productionDept.id,
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'Vehicles',
        description: 'Company vehicles and transport',
        companyId: company.id,
        responsibleDeptId: logisticsDept.id,
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'Computers',
        description: 'Desktop computers and laptops',
        companyId: company.id,
        responsibleDeptId: itDept.id,
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'Printers',
        description: 'Office printers and scanners',
        companyId: company.id,
        responsibleDeptId: itDept.id,
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'HVAC',
        description: 'Heating, ventilation, and air conditioning',
        companyId: company.id,
        responsibleDeptId: adminDept.id,
      },
    }),
  ]);

  const [cncCategory, vehiclesCategory, computersCategory, printersCategory, hvacCategory] = categories;

  // Create work centers
  console.log('🏭 Creating work centers...');
  const workCenters = await Promise.all([
    prisma.workCenter.create({
      data: {
        name: 'Assembly Line A',
        code: 'WC-ASM-A',
        tag: 'Primary',
        costPerHour: 150.00,
        capacityTimeEfficiency: 95,
        oeeTarget: 85,
        description: 'Primary assembly line for product manufacturing',
        companyId: company.id,
      },
    }),
    prisma.workCenter.create({
      data: {
        name: 'Assembly Line B',
        code: 'WC-ASM-B',
        tag: 'Secondary',
        costPerHour: 120.00,
        capacityTimeEfficiency: 90,
        oeeTarget: 80,
        description: 'Secondary assembly line',
        companyId: company.id,
      },
    }),
    prisma.workCenter.create({
      data: {
        name: 'CNC Workshop',
        code: 'WC-CNC',
        tag: 'Machining',
        costPerHour: 200.00,
        capacityTimeEfficiency: 92,
        oeeTarget: 88,
        description: 'CNC machining center',
        companyId: company.id,
      },
    }),
  ]);

  const [wcAssemblyA, wcAssemblyB, wcCNC] = workCenters;

  // Set alternative work centers
  await prisma.workCenter.update({
    where: { id: wcAssemblyA.id },
    data: { alternativeWorkCenterId: wcAssemblyB.id },
  });

  // Create equipment
  console.log('⚙️ Creating equipment...');
  const equipment = await Promise.all([
    // CNC Machines
    prisma.equipment.create({
      data: {
        name: 'CNC Milling Machine 001',
        serialNumber: 'CNC-M-001',
        model: 'Haas VF-2',
        purchaseDate: new Date('2020-03-15'),
        warrantyExpiry: new Date('2025-03-15'),
        location: 'Building A, Floor 1',
        description: '3-axis vertical milling center',
        healthPercentage: 85,
        status: 'ACTIVE',
        companyId: company.id,
        categoryId: cncCategory.id,
        departmentId: productionDept.id,
        technicianId: mikeTech.id,
        maintenanceTeamId: mechanicsTeam.id,
        workCenterId: wcCNC.id,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'CNC Lathe 001',
        serialNumber: 'CNC-L-001',
        model: 'Mazak QTN-200',
        purchaseDate: new Date('2019-08-20'),
        warrantyExpiry: new Date('2024-08-20'),
        location: 'Building A, Floor 1',
        description: 'CNC turning center',
        healthPercentage: 25,
        status: 'UNDER_MAINTENANCE',
        companyId: company.id,
        categoryId: cncCategory.id,
        departmentId: productionDept.id,
        technicianId: mikeTech.id,
        maintenanceTeamId: mechanicsTeam.id,
        workCenterId: wcCNC.id,
      },
    }),
    // Vehicles
    prisma.equipment.create({
      data: {
        name: 'Forklift 001',
        serialNumber: 'FL-001',
        model: 'Toyota 8FGU25',
        purchaseDate: new Date('2021-01-10'),
        warrantyExpiry: new Date('2026-01-10'),
        location: 'Warehouse A',
        description: '5000 lb capacity forklift',
        healthPercentage: 90,
        status: 'ACTIVE',
        companyId: company.id,
        categoryId: vehiclesCategory.id,
        departmentId: logisticsDept.id,
        ownerId: bobEmployee.id,
        technicianId: mikeTech.id,
        maintenanceTeamId: mechanicsTeam.id,
      },
    }),
    // Computers
    prisma.equipment.create({
      data: {
        name: 'Workstation PC-001',
        serialNumber: 'PC-WS-001',
        model: 'Dell Precision 5820',
        purchaseDate: new Date('2022-06-01'),
        warrantyExpiry: new Date('2025-06-01'),
        location: 'Office Building, Room 101',
        description: 'Engineering workstation',
        healthPercentage: 95,
        status: 'ACTIVE',
        companyId: company.id,
        categoryId: computersCategory.id,
        departmentId: itDept.id,
        ownerId: aliceEmployee.id,
        technicianId: tomTech.id,
        maintenanceTeamId: itTeam.id,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Laptop LP-001',
        serialNumber: 'LP-001',
        model: 'Dell Latitude 5520',
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2026-01-15'),
        location: 'Mobile',
        description: 'Employee laptop',
        healthPercentage: 98,
        status: 'ACTIVE',
        companyId: company.id,
        categoryId: computersCategory.id,
        departmentId: itDept.id,
        ownerId: bobEmployee.id,
        technicianId: tomTech.id,
        maintenanceTeamId: itTeam.id,
        assignedDate: new Date('2023-01-20'),
      },
    }),
    // Printers
    prisma.equipment.create({
      data: {
        name: 'Printer 01',
        serialNumber: 'PR-001',
        model: 'HP LaserJet Pro M428fdn',
        purchaseDate: new Date('2022-03-01'),
        warrantyExpiry: new Date('2025-03-01'),
        location: 'Office Building, Room 105',
        description: 'Network multifunction printer',
        healthPercentage: 75,
        status: 'ACTIVE',
        companyId: company.id,
        categoryId: printersCategory.id,
        departmentId: adminDept.id,
        technicianId: tomTech.id,
        maintenanceTeamId: itTeam.id,
      },
    }),
    // HVAC
    prisma.equipment.create({
      data: {
        name: 'HVAC Unit Building A',
        serialNumber: 'HVAC-A-001',
        model: 'Carrier 50XC',
        purchaseDate: new Date('2018-05-01'),
        warrantyExpiry: new Date('2023-05-01'),
        location: 'Building A, Roof',
        description: 'Central air conditioning unit',
        healthPercentage: 60,
        status: 'ACTIVE',
        companyId: company.id,
        categoryId: hvacCategory.id,
        departmentId: adminDept.id,
        technicianId: lisaTech.id,
        maintenanceTeamId: electriciansTeam.id,
      },
    }),
    // Critical equipment (low health)
    prisma.equipment.create({
      data: {
        name: 'Air Compressor 001',
        serialNumber: 'AC-001',
        model: 'Ingersoll Rand R110',
        purchaseDate: new Date('2015-02-01'),
        warrantyExpiry: new Date('2020-02-01'),
        location: 'Building A, Basement',
        description: 'Industrial air compressor - needs replacement',
        healthPercentage: 20,
        status: 'ACTIVE',
        companyId: company.id,
        categoryId: cncCategory.id,
        departmentId: productionDept.id,
        technicianId: mikeTech.id,
        maintenanceTeamId: mechanicsTeam.id,
      },
    }),
  ]);

  const [cncMill, cncLathe, forklift, workstation, laptop, printer, hvac, compressor] = equipment;

  // Create maintenance requests
  console.log('📝 Creating maintenance requests...');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await Promise.all([
    // Corrective (Breakdown) requests
    prisma.maintenanceRequest.create({
      data: {
        subject: 'CNC Lathe Spindle Failure',
        description: 'Spindle motor making grinding noise and overheating. Machine has been shut down.',
        requestType: 'CORRECTIVE',
        stage: 'IN_PROGRESS',
        priority: 'HIGH',
        requestDate: lastWeek,
        startDate: yesterday,
        companyId: company.id,
        equipmentId: cncLathe.id,
        categoryId: cncCategory.id,
        teamId: mechanicsTeam.id,
        technicianId: mikeTech.id,
        createdById: aliceEmployee.id,
        isOverdue: false,
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        subject: 'Printer Paper Jam Issue',
        description: 'Printer frequently jams, especially with heavier paper.',
        requestType: 'CORRECTIVE',
        stage: 'NEW',
        priority: 'LOW',
        requestDate: today,
        companyId: company.id,
        equipmentId: printer.id,
        categoryId: printersCategory.id,
        teamId: itTeam.id,
        createdById: bobEmployee.id,
        isOverdue: false,
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        subject: 'HVAC Not Cooling Properly',
        description: 'Building A temperature not reaching set point. Suspected refrigerant leak.',
        requestType: 'CORRECTIVE',
        stage: 'NEW',
        priority: 'MEDIUM',
        requestDate: yesterday,
        scheduledDate: lastWeek,
        companyId: company.id,
        equipmentId: hvac.id,
        categoryId: hvacCategory.id,
        teamId: electriciansTeam.id,
        createdById: manager.id,
        isOverdue: true,
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        subject: 'Air Compressor Oil Change',
        description: 'Urgent oil change needed. Oil quality degraded.',
        requestType: 'CORRECTIVE',
        stage: 'NEW',
        priority: 'HIGH',
        requestDate: today,
        companyId: company.id,
        equipmentId: compressor.id,
        categoryId: cncCategory.id,
        teamId: mechanicsTeam.id,
        createdById: mikeTech.id,
        isOverdue: false,
      },
    }),
    // Preventive (Routine) requests
    prisma.maintenanceRequest.create({
      data: {
        subject: 'CNC Mill Monthly Maintenance',
        description: 'Monthly preventive maintenance: lubrication, coolant check, alignment verification.',
        requestType: 'PREVENTIVE',
        stage: 'NEW',
        priority: 'MEDIUM',
        requestDate: today,
        scheduledDate: nextWeek,
        companyId: company.id,
        equipmentId: cncMill.id,
        categoryId: cncCategory.id,
        teamId: mechanicsTeam.id,
        technicianId: mikeTech.id,
        createdById: manager.id,
        isOverdue: false,
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        subject: 'Forklift Annual Inspection',
        description: 'Annual safety inspection and maintenance per OSHA requirements.',
        requestType: 'PREVENTIVE',
        stage: 'NEW',
        priority: 'HIGH',
        requestDate: today,
        scheduledDate: nextWeek,
        companyId: company.id,
        equipmentId: forklift.id,
        categoryId: vehiclesCategory.id,
        teamId: mechanicsTeam.id,
        createdById: manager.id,
        isOverdue: false,
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        subject: 'Workstation Software Update',
        description: 'Quarterly OS and software updates for engineering workstation.',
        requestType: 'PREVENTIVE',
        stage: 'REPAIRED',
        priority: 'LOW',
        requestDate: lastWeek,
        scheduledDate: yesterday,
        startDate: yesterday,
        completionDate: today,
        duration: 2.5,
        companyId: company.id,
        equipmentId: workstation.id,
        categoryId: computersCategory.id,
        teamId: itTeam.id,
        technicianId: tomTech.id,
        createdById: manager.id,
        notes: 'Updated Windows, Office, and engineering software. All systems operational.',
        isOverdue: false,
      },
    }),
  ]);

  console.log('\n✅ Database seeded successfully!\n');
  console.log('📋 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Role                | Email              | Password');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin               | admin@acme.com     | Admin@123');
  console.log('Maintenance Manager | manager@acme.com   | Admin@123');
  console.log('Technician          | mike@acme.com      | Admin@123');
  console.log('Technician          | lisa@acme.com      | Admin@123');
  console.log('Technician (IT)     | tom@acme.com       | Admin@123');
  console.log('Employee            | alice@acme.com     | Admin@123');
  console.log('Employee            | bob@acme.com       | Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Company Invite Code: GG-ACME-1234');
  console.log('📧 Allowed Email Domains: @acme.com, @acme.co.in\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
