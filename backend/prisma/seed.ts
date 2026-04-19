import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Status mapping: ISP → Prisma UserStatus ───────────────
type PrismaUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'TRIAL';

function mapIspStatus(ispStatus: string): PrismaUserStatus {
  switch (ispStatus) {
    case 'ACTIVO':
      return 'ACTIVE';
    case 'SUSPENDIDO':
      return 'SUSPENDED';
    case 'CORTADO':
    case 'ANULADO':
      return 'INACTIVE';
    default:
      return 'PENDING';
  }
}

// ─── Subscriber data ────────────────────────────────────────
interface SubscriberData {
  nombre: string;
  firstName: string;
  lastName: string;
  email: string;
  telefono: string;
  contrato: string;
  plan: string;
  maxDevices: number;
  status: string;
  fechaInicio: string;
  fechaFin: string;
}

const subscribers: SubscriberData[] = [
  { nombre: 'CASTRO DANIEL', firstName: 'CASTRO', lastName: 'DANIEL', email: '', telefono: '0987284494', contrato: '000000000', plan: 'PLAN BASICO', maxDevices: 2, status: 'ANULADO', fechaInicio: '2020-09-14', fechaFin: '' },
  { nombre: 'DOICELA NEGRETE JEFFERSON XAVIER', firstName: 'DOICELA', lastName: 'NEGRETE', email: 'facturacion@luki.ec', telefono: '0939246460', contrato: '000000002', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-08-27', fechaFin: '2022-12-01' },
  { nombre: 'PASTUNA CHUSIN MANUEL', firstName: 'PASTUNA', lastName: 'CHUSIN', email: 'manuelpastunachusin@gmail.com', telefono: '0939218464', contrato: '000000003', plan: 'PLAN BASICO', maxDevices: 2, status: 'ACTIVO', fechaInicio: '2020-08-28', fechaFin: '2025-10-17' },
  { nombre: 'CATOTA YUGSI JENNY GUADALUPE', firstName: 'CATOTA', lastName: 'YUGSI', email: 'facturacion@luki.ec', telefono: '0988062117', contrato: '000000004', plan: 'PLAN BASICO', maxDevices: 2, status: 'ACTIVO', fechaInicio: '2020-08-28', fechaFin: '2026-03-11' },
  { nombre: 'GUAINALLA CASILLAS TANIA SOLEDAD', firstName: 'GUAINALLA', lastName: 'CASILLAS', email: 'taniaguainalla03@gmail.com', telefono: '0979361442', contrato: '000000005', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-08-31', fechaFin: '2022-11-25' },
  { nombre: 'DE LA CRUZ QUIROZ VERONICA VIVIANA', firstName: 'DE LA CRUZ', lastName: 'QUIROZ', email: 'Vq346299@gmail.com', telefono: '0983535889', contrato: '000000006', plan: 'PLAN BASICO', maxDevices: 2, status: 'CORTADO', fechaInicio: '2020-08-31', fechaFin: '2023-03-16' },
  { nombre: 'AYALA USUNO JOSE NEPTALI', firstName: 'AYALA', lastName: 'USUNO', email: 'ayala.r.alex20@gmail.com', telefono: '0995366940', contrato: '000000007', plan: 'PLAN HOGAR SUPER', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-08-31', fechaFin: '2026-03-11' },
  { nombre: 'TOASA QUISHPE MARIA TERESA', firstName: 'TOASA', lastName: 'QUISHPE', email: 'facturacion@luki.ec', telefono: '0984921659', contrato: '000000009', plan: 'PLAN HOGAR SUPER PLUS', maxDevices: 5, status: 'ACTIVO', fechaInicio: '2020-08-31', fechaFin: '' },
  { nombre: 'GANCINO JAILACA MARIA NARCISA', firstName: 'GANCINO', lastName: 'JAILACA', email: 'aguaizaerika61@gmail.com', telefono: '0984134246', contrato: '000000010', plan: 'PLAN PRO', maxDevices: 3, status: 'ACTIVO', fechaInicio: '2020-09-01', fechaFin: '2024-04-17' },
  { nombre: 'TAMAY GUARACA JOSE DOMINGO', firstName: 'TAMAY', lastName: 'GUARACA', email: 'facturacion@luki.ec', telefono: '0993214258', contrato: '000000011', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-01', fechaFin: '2023-08-14' },
  { nombre: 'SANCHEZ LLANO SILVIA ADRIANA', firstName: 'SANCHEZ', lastName: 'LLANO', email: 'mauriciosasnalema@gmail.com', telefono: '0983881636', contrato: '000000012', plan: 'PLAN HOGAR IDEAL PLUS', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-01', fechaFin: '2024-12-17' },
  { nombre: 'YUPANGUI YUPANGUI ANA LUCIA', firstName: 'YUPANGUI', lastName: 'YUPANGUI', email: 'facturacion@luki.ec', telefono: '0994193126', contrato: '000000013', plan: 'PLAN HOGAR SUPER', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-01', fechaFin: '2026-03-11' },
  { nombre: 'VEGA TIGASI JOSE PABLO', firstName: 'VEGA', lastName: 'TIGASI', email: 'jovetigaci@gmail.com', telefono: '0968013569', contrato: '000000014', plan: 'PLAN HOGAR SUPER PLUS', maxDevices: 5, status: 'ACTIVO', fechaInicio: '2020-09-01', fechaFin: '2026-02-11' },
  { nombre: 'PALLO ALAJO SEGUNDO JUAN', firstName: 'PALLO', lastName: 'ALAJO', email: 'juanpallo05@gmail.com', telefono: '0959550924', contrato: '000000015', plan: 'PLAN HOGAR IDEAL PLUS', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-02', fechaFin: '2025-12-12' },
  { nombre: 'LLAMUCA IZA BLANCA BEATRIZ', firstName: 'LLAMUCA', lastName: 'IZA', email: 'facturacion@luki.ec', telefono: '0994531033', contrato: '000000016', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-02', fechaFin: '2022-03-24' },
  { nombre: 'VILLAR ALLAUCA AGUSTIN', firstName: 'VILLAR', lastName: 'ALLAUCA', email: 'facturacion@luki.ec', telefono: '0981704691', contrato: '000000017', plan: 'PLAN PREMIUM', maxDevices: 3, status: 'CORTADO', fechaInicio: '2020-09-02', fechaFin: '2023-01-18' },
  { nombre: 'VELASCO ROSERO LIZBETH ALEJANDRA', firstName: 'VELASCO', lastName: 'ROSERO', email: 'facturacion@luki.ec', telefono: '0980716767', contrato: '000000018', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-02', fechaFin: '2022-08-01' },
  { nombre: 'PALAQUINBAY CAMPOS ANGEL NICOLAS', firstName: 'PALAQUINBAY', lastName: 'CAMPOS', email: 'angelpalaquibay69@gmail.com', telefono: '0998482585', contrato: '000000019', plan: 'PLAN HOGAR IDEAL PLUS', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-02', fechaFin: '2026-02-11' },
  { nombre: 'PERDOMO JAMI JOSE RODRIGO', firstName: 'PERDOMO', lastName: 'JAMI', email: 'facturacion@luki.ec', telefono: '0985084080', contrato: '000000020', plan: 'PLAN HOGAR SUPER PLUS', maxDevices: 5, status: 'ACTIVO', fechaInicio: '2020-09-02', fechaFin: '2026-02-11' },
  { nombre: 'QUISHPE ANTE OLIMPIA', firstName: 'QUISHPE', lastName: 'ANTE', email: 'facturacion@luki.ec', telefono: '0995726023', contrato: '000000021', plan: 'PLAN HOGAR IDEAL PLUS', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-02', fechaFin: '2025-06-12' },
  { nombre: 'GUANOQUIZA LOGRO CESARIO', firstName: 'GUANOQUIZA', lastName: 'LOGRO', email: 'facturacion@luki.ec', telefono: '0993069762', contrato: '000000022', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-02', fechaFin: '2024-06-24' },
  { nombre: 'CHONGA CACHUPUD JOSE MANUEL', firstName: 'CHONGA', lastName: 'CACHUPUD', email: 'facturacion@luki.ec', telefono: '0998310674', contrato: '000000023', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-02', fechaFin: '2023-11-17' },
  { nombre: 'TAMAMI QUINATOA DAYSI MARIBEL', firstName: 'TAMAMI', lastName: 'QUINATOA', email: 'facturacion@luki.ec', telefono: '0998876463', contrato: '000000024', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-02', fechaFin: '2022-08-01' },
  { nombre: 'RAMON CABRERA CARMEN SONIA', firstName: 'RAMON', lastName: 'CABRERA', email: 'mary180betty@gmail.com', telefono: '0994922196', contrato: '000000025', plan: 'PACK BASICO', maxDevices: 2, status: 'CORTADO', fechaInicio: '2020-09-02', fechaFin: '2023-12-26' },
  { nombre: 'LOPEZ LLANGA NORMA ELIZABETH', firstName: 'LOPEZ', lastName: 'LLANGA', email: 'Soldamarcelo90@gmail.com', telefono: '0989590010', contrato: '000000026', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-02', fechaFin: '2022-12-27' },
  { nombre: 'QUISHPE VILLAR MARIA DOLORES', firstName: 'QUISHPE', lastName: 'VILLAR', email: 'facturacion@luki.ec', telefono: '0959744564', contrato: '000000027', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-03', fechaFin: '2021-10-28' },
  { nombre: 'SALAZAR NARANJO OSCAR ROLANDO', firstName: 'SALAZAR', lastName: 'NARANJO', email: 'facturacion@luki.ec', telefono: '0981061497', contrato: '000000028', plan: 'PLAN BASICO', maxDevices: 2, status: 'ACTIVO', fechaInicio: '2020-09-03', fechaFin: '2025-06-16' },
  { nombre: 'ORDONEZ SINCHIRE LUISA LILY', firstName: 'ORDONEZ', lastName: 'SINCHIRE', email: '1940@outlook.com', telefono: '0995400720', contrato: '000000029', plan: 'PLAN HOGAR SUPER', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-03', fechaFin: '' },
  { nombre: 'BORJA BORJA JULIO RAMIRO', firstName: 'BORJA', lastName: 'BORJA', email: 'facturacion@luki.ec', telefono: '0995295389', contrato: '000000031', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-03', fechaFin: '2022-01-19' },
  { nombre: 'PAZOS OROSCO GABRIELA BRIGITE', firstName: 'PAZOS', lastName: 'OROSCO', email: 'facturacion@luki.ec', telefono: '0987229463', contrato: '000000032', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-03', fechaFin: '2024-12-13' },
  { nombre: 'TOTASIG CAILLAGUA NELSON JAVIER', firstName: 'TOTASIG', lastName: 'CAILLAGUA', email: 'facturacion@luki.ec', telefono: '0959847430', contrato: '000000033', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-03', fechaFin: '2021-12-01' },
  { nombre: 'CAVA QUISHPE JUAN CARLOS', firstName: 'CAVA', lastName: 'QUISHPE', email: 'facturacion@luki.ec', telefono: '0993815854', contrato: '000000034', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-03', fechaFin: '2021-11-18' },
  { nombre: 'MUNOZ GUAMAN LUIS MIGUEL', firstName: 'MUNOZ', lastName: 'GUAMAN', email: 'miguicho-593@hotmail.com', telefono: '0994206701', contrato: '000000035', plan: 'PLAN BASICO', maxDevices: 2, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '2025-09-11' },
  { nombre: 'TOAQUIZA VEGA LUIS', firstName: 'TOAQUIZA', lastName: 'VEGA', email: 'luistoaquizavega2410@gmail.com', telefono: '0989800810', contrato: '000000036', plan: 'PLAN HOGAR SUPER PLUS', maxDevices: 5, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '2026-02-11' },
  { nombre: 'LUCINA OYOS CLERIDA GRENEIMI', firstName: 'LUCINA', lastName: 'OYOS', email: 'robertocastillolucina@gamil.com', telefono: '0962698199', contrato: '000000038', plan: 'ESPECIAL', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '2026-03-11' },
  { nombre: 'TENELEMA GUALA ELVIA JOHANNA', firstName: 'TENELEMA', lastName: 'GUALA', email: 'elviatenelema281@gmail.com', telefono: '0981060962', contrato: '000000039', plan: 'PLAN HOGAR SUPER PLUS', maxDevices: 5, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '' },
  { nombre: 'SHULCA JACOME CARMEN MARLENE', firstName: 'SHULCA', lastName: 'JACOME', email: 'facturacion@luki.ec', telefono: '0939699558', contrato: '000000040', plan: 'PACK BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-04', fechaFin: '2023-04-12' },
  { nombre: 'LEMA PAGUAY PATRICIA', firstName: 'LEMA', lastName: 'PAGUAY', email: 'lemluis90@gmail.com', telefono: '0999821489', contrato: '000000041', plan: 'PLAN BASICO', maxDevices: 2, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '2024-09-18' },
  { nombre: 'MONAR AVEROS EDGAR VINICIO', firstName: 'MONAR', lastName: 'AVEROS', email: 'edgarmonar02@gmail.com', telefono: '0961818075', contrato: '000000042', plan: 'PLAN BASICO', maxDevices: 2, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '2026-01-13' },
  { nombre: 'CRIOLLO CRIOLLO NELSON PATRICIO', firstName: 'CRIOLLO', lastName: 'CRIOLLO', email: 'facturacion@luki.ec', telefono: '0995437322', contrato: '000000043', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-04', fechaFin: '2023-08-14' },
  { nombre: 'MIRANDA ROMERO MARIA ELENA', firstName: 'MIRANDA', lastName: 'ROMERO', email: 'facturacion@luki.ec', telefono: '0998472165', contrato: '000000044', plan: 'PLAN HOGAR IDEAL PLUS', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '2025-11-13' },
  { nombre: 'LISINTUNA GAVILANES MARIA TERESA', firstName: 'LISINTUNA', lastName: 'GAVILANES', email: 'facturacion@luki.ec', telefono: '0967690616', contrato: '000000045', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-04', fechaFin: '2024-02-22' },
  { nombre: 'TAPIA MARIA BEATRIZ', firstName: 'TAPIA', lastName: 'MARIA', email: 'facturacion@luki.ec', telefono: '0992825924', contrato: '000000046', plan: 'ESPECIAL', maxDevices: 4, status: 'ACTIVO', fechaInicio: '2020-09-04', fechaFin: '2026-02-11' },
  { nombre: 'BORJA PAZOS NELSON RODRIGO', firstName: 'BORJA', lastName: 'PAZOS', email: 'facturacion@luki.ec', telefono: '0991884152', contrato: '000000047', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-05', fechaFin: '2021-09-29' },
  { nombre: 'FLORES SANTAMARIA LORENA MIRELLA', firstName: 'FLORES', lastName: 'SANTAMARIA', email: 'jusbeck11@gmail.com', telefono: '0985715903', contrato: '000000048', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-05', fechaFin: '2022-11-25' },
  { nombre: 'SANTI SATAN MARIA DEL CARMEN', firstName: 'SANTI', lastName: 'SATAN', email: 'facturacion@luki.ec', telefono: '0995217820', contrato: '000000049', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-05', fechaFin: '2022-09-26' },
  { nombre: 'TOCTE VELASQUE WILLAN ANIBAL', firstName: 'TOCTE', lastName: 'VELASQUE', email: 'facturacion@luki.ec', telefono: '0999734512', contrato: '000000050', plan: 'PLAN BASICO', maxDevices: 2, status: 'SUSPENDIDO', fechaInicio: '2020-09-06', fechaFin: '2021-09-21' },
];

async function main() {
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  await prisma.$transaction(async (tx) => {
    // ─── 1. Create the unique Plan ──────────────────────────
    await tx.plan.upsert({
      where: { id: 'plan-lukiplay' },
      update: {},
      create: {
        id: 'plan-lukiplay',
        nombre: 'LUKI PLAY',
        descripcion: 'Streaming incluido con tu servicio de internet Luki',
        activo: true,
        maxDevices: 2,
        maxConcurrentStreams: 1,
        maxProfiles: 3,
        videoQuality: 'HD',
        allowDownloads: false,
        allowCasting: true,
        hasAds: true,
        entitlements: ['live-tv', 'vod-basic', 'sports'],
        allowedComponentIds: [],
        allowedCategoryIds: [],
      },
    });

    console.log('✅ Plan "LUKI PLAY" created');

    // ─── 2. Create internal CMS users ───────────────────────
    await tx.customer.upsert({
      where: { email: 'admin@lukiplay.com' },
      update: {},
      create: {
        nombre: 'Admin Principal',
        firstName: 'Admin',
        lastName: 'Principal',
        email: 'admin@lukiplay.com',
        passwordHash: defaultPasswordHash,
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        isCmsUser: true,
        isSubscriber: false,
        isAccountActivated: true,
      },
    });

    await tx.customer.upsert({
      where: { email: 'soporte@lukiplay.com' },
      update: {},
      create: {
        nombre: 'Agente Soporte',
        firstName: 'Agente',
        lastName: 'Soporte',
        email: 'soporte@lukiplay.com',
        passwordHash: defaultPasswordHash,
        role: 'SOPORTE',
        status: 'ACTIVE',
        isCmsUser: true,
        isSubscriber: false,
        isAccountActivated: true,
      },
    });

    console.log('✅ 2 CMS users created (admin + soporte)');

    // ─── 3. Create subscribers with contracts ───────────────
    for (const sub of subscribers) {
      const isIspEmail = sub.email === 'facturacion@luki.ec';
      const hasNoEmail = sub.email === '';
      const customerEmail = isIspEmail || hasNoEmail ? null : sub.email;
      const ispEmail = isIspEmail ? 'facturacion@luki.ec' : null;

      const customer = await tx.customer.create({
        data: {
          nombre: sub.nombre,
          firstName: sub.firstName,
          lastName: sub.lastName,
          email: customerEmail,
          ispEmail,
          telefono: sub.telefono,
          passwordHash: defaultPasswordHash,
          role: 'CLIENTE',
          status: mapIspStatus(sub.status),
          mustChangePassword: true,
          isCmsUser: false,
          isSubscriber: true,
          isAccountActivated: false,
        },
      });

      await tx.contract.create({
        data: {
          customerId: customer.id,
          contractNumber: sub.contrato,
          planName: 'LUKI PLAY',
          ispPlanName: sub.plan,
          maxDevices: sub.maxDevices,
          maxConcurrentStreams: 1,
          sessionDurationDays: 30,
          sessionLimitPolicy: 'BLOCK_NEW',
          fechaInicio: sub.fechaInicio ? new Date(sub.fechaInicio) : null,
          fechaFin: sub.fechaFin ? new Date(sub.fechaFin) : null,
        },
      });
    }

    console.log(`✅ ${subscribers.length} subscribers with contracts created`);
  });

  console.log('🎉 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
