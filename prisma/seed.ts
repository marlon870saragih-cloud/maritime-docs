import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Bersihkan data lama (urutan sesuai foreign key)
  await prisma.documentItem.deleteMany();
  await prisma.document.deleteMany();
  await prisma.portCall.deleteMany();
  await prisma.crewMember.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vessel.deleteMany();
  await prisma.port.deleteMany();
  await prisma.company.deleteMany();

  const hash = await bcrypt.hash('password123', 10);
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const company = await prisma.company.create({
    data: {
      name: 'PT Demo Maritim Nusantara',
      alias: 'Demo Maritim',
      address: 'Jl. Pelabuhan No. 1',
      city: 'Samarinda',
      province: 'Kalimantan Timur',
      country: 'Indonesia',
      phone: '0541-0000000',
      emailOps: 'ops@demomaritim.id',
      npwp: '01.234.567.8-901.000',
      signerName: 'Budi Santoso',
      signerTitle: 'Operations Manager',
      subscriptionPlan: 'trial',
      subscriptionExpiresAt: trialEnd,
      bankAccounts: {
        create: [
          { bankName: 'Bank Mandiri', accountNumber: '123-456-7890', holderName: 'PT Demo Maritim Nusantara', currency: 'IDR', isDefault: true, branch: 'Samarinda' },
          { bankName: 'Bank Mandiri', accountNumber: '098-765-4321', holderName: 'PT Demo Maritim Nusantara', currency: 'USD', isDefault: true, swiftCode: 'BMRIIDJA' },
        ],
      },
    },
  });

  const admin = await prisma.user.create({
    data: { companyId: company.id, fullName: 'Admin Demo', email: 'admin@demo.id', passwordHash: hash, role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { companyId: company.id, fullName: 'Operator Demo', email: 'operator@demo.id', passwordHash: hash, role: 'OPERATOR' },
  });
  await prisma.user.create({
    data: { companyId: company.id, fullName: 'Viewer Demo', email: 'viewer@demo.id', passwordHash: hash, role: 'VIEWER' },
  });

  const vessel1 = await prisma.vessel.create({
    data: {
      companyId: company.id, vesselName: 'MV Borneo Express', imoNumber: '9123456', callSign: 'YBNE',
      flag: 'Indonesia', vesselType: 'General Cargo', grossTonnage: 8500, netTonnage: 4200,
      deadweight: 12000, loa: 118, builtYear: 2012, classification: 'BKI',
      ownerName: 'PT Demo Maritim Nusantara',
    },
  });
  const vessel2 = await prisma.vessel.create({
    data: {
      companyId: company.id, vesselName: 'MT Mahakam Tanker', imoNumber: '9234567', callSign: 'YMHT',
      flag: 'Indonesia', vesselType: 'Tanker', grossTonnage: 15800, deadweight: 25000,
      loa: 160, builtYear: 2015, classification: 'BKI',
    },
  });

  const port1 = await prisma.port.create({
    data: { companyId: company.id, portName: 'Samarinda', portCode: 'SRI', country: 'Indonesia', locode: 'IDSRI' },
  });
  await prisma.port.create({
    data: { companyId: company.id, portName: 'Balikpapan', portCode: 'BPN', country: 'Indonesia', locode: 'IDBPN' },
  });

  await prisma.portCall.create({
    data: {
      companyId: company.id, vesselId: vessel1.id, portId: port1.id,
      callReference: 'PC-202606-001', voyageNumber: '012/2026',
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      etd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      berthName: 'Berth 3', cargoType: 'Coal', cargoQuantity: 7500, cargoUnit: 'MT',
      shipper: 'Coal Mining Co.', consignee: 'Energy Trading Ltd.', principal: 'Borneo Bulk Carriers',
      status: 'ACTIVE', createdById: admin.id,
    },
  });

  const crewData = [
    { fullName: 'Capt. Ahmad Rifai', rank: 'Master', nationality: 'Indonesia', passportNumber: 'A1234567', seamanBook: 'B0112233' },
    { fullName: 'Joko Prasetyo', rank: 'Chief Officer', nationality: 'Indonesia', passportNumber: 'A2345678', seamanBook: 'B0223344' },
    { fullName: 'Made Wirawan', rank: 'Chief Engineer', nationality: 'Indonesia', passportNumber: 'A3456789', seamanBook: 'B0334455' },
    { fullName: 'Rudi Hartono', rank: 'Bosun', nationality: 'Indonesia', passportNumber: 'A4567890', seamanBook: 'B0445566' },
  ];
  for (const c of crewData) {
    await prisma.crewMember.create({
      data: { ...c, companyId: company.id, vesselId: vessel1.id, signOnDate: new Date('2026-03-01') },
    });
  }

  console.log('Seed selesai: 1 company, 3 users, 2 vessels, 2 ports, 1 port call, 4 crew');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
