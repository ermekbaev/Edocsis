import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.file.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.document.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Администратор",
      email: "admin@edocsis.com",
      password: hashedPassword,
      role: "ADMIN",
      department: "IT",
    },
  });

  // Create templates with fields
  console.log("📋 Creating templates...");

  const serviceContract = await prisma.template.create({
    data: {
      name: "Договор на оказание услуг",
      description: "Стандартный шаблон договора на оказание услуг с контрагентами",
      content:
        "ДОГОВОР НА ОКАЗАНИЕ УСЛУГ\\n\\nДата: {{contractDate}}\\nКлиент: {{clientName}}\\nАдрес: {{clientAddress}}\\n\\nУслуги: {{servicesDescription}}\\nСумма: {{contractAmount}} тг.\\nНачало: {{startDate}}\\nОкончание: {{endDate}}",
      fields: JSON.parse(
        JSON.stringify([
          {
            key: "contractDate",
            label: "Дата договора",
            type: "date",
            required: true,
          },
          {
            key: "clientName",
            label: "Наименование клиента",
            type: "text",
            required: true,
          },
          {
            key: "clientAddress",
            label: "Адрес клиента",
            type: "textarea",
            required: true,
          },
          {
            key: "clientRegNumber",
            label: "Регистрационный номер клиента",
            type: "text",
            required: false,
          },
          {
            key: "servicesDescription",
            label: "Описание услуг",
            type: "textarea",
            required: true,
          },
          {
            key: "contractAmount",
            label: "Сумма договора (тг.)",
            type: "number",
            required: true,
          },
          {
            key: "paymentSchedule",
            label: "График оплаты",
            type: "text",
            required: false,
          },
          {
            key: "paymentDueDate",
            label: "Срок оплаты",
            type: "date",
            required: true,
          },
          {
            key: "startDate",
            label: "Дата начала договора",
            type: "date",
            required: true,
          },
          {
            key: "endDate",
            label: "Дата окончания договора",
            type: "date",
            required: true,
          },
        ]),
      ),
      createdById: admin.id,
    },
  });

  const nda = await prisma.template.create({
    data: {
      name: "Соглашение о неразглашении",
      description: "Соглашение о конфиденциальности для делового партнёрства",
      content:
        'СОГЛАШЕНИЕ О НЕРАЗГЛАШЕНИИ\\n\\nНастоящее Соглашение о неразглашении ("Соглашение") заключено {{agreementDate}} между:\\n\\nРАСКРЫВАЮЩАЯ СТОРОНА:\\nНаименование: {{disclosingPartyName}}\\nАдрес: {{disclosingPartyAddress}}\\n\\nПОЛУЧАЮЩАЯ СТОРОНА:\\nНаименование: {{receivingPartyName}}\\nАдрес: {{receivingPartyAddress}}\\n\\nЦЕЛЬ:\\n{{purposeDescription}}\\n\\n1. КОНФИДЕНЦИАЛЬНАЯ ИНФОРМАЦИЯ\\nСтороны обязуются сохранять конфиденциальность всей информации, переданной в ходе сотрудничества.\\n\\n2. ОБЯЗАТЕЛЬСТВА\\nСрок конфиденциальности: {{confidentialityYears}} лет\\nОбязательства о неразглашении действуют с: {{effectiveDate}}\\n\\n3. ИСКЛЮЧЕНИЯ\\nИнформация, находящаяся в открытом доступе, не является конфиденциальной.\\n\\nПодписано: {{agreementDate}}',
      fields: JSON.parse(
        JSON.stringify([
          {
            key: "agreementDate",
            label: "Дата соглашения",
            type: "date",
            required: true,
          },
          {
            key: "disclosingPartyName",
            label: "Наименование раскрывающей стороны",
            type: "text",
            required: true,
          },
          {
            key: "disclosingPartyAddress",
            label: "Адрес раскрывающей стороны",
            type: "textarea",
            required: true,
          },
          {
            key: "receivingPartyName",
            label: "Наименование получающей стороны",
            type: "text",
            required: true,
          },
          {
            key: "receivingPartyAddress",
            label: "Адрес получающей стороны",
            type: "textarea",
            required: true,
          },
          {
            key: "purposeDescription",
            label: "Цель соглашения",
            type: "textarea",
            required: true,
          },
          {
            key: "confidentialityYears",
            label: "Срок конфиденциальности (лет)",
            type: "number",
            required: true,
          },
          {
            key: "effectiveDate",
            label: "Дата вступления в силу",
            type: "date",
            required: true,
          },
        ]),
      ),
      createdById: admin.id,
    },
  });

  const hrContract = await prisma.template.create({
    data: {
      name: "Трудовой договор",
      description: "Стандартный трудовой договор для новых сотрудников",
      content:
        "ТРУДОВОЙ ДОГОВОР\\n\\nФИО сотрудника: {{employeeName}}\\nДолжность: {{position}}\\nОтдел: {{department}}\\n\\nДата начала: {{startDate}}\\nЗарплата: {{salary}} тг./мес.\\n\\nГрафик работы: {{workSchedule}}\\nИспытательный срок: {{probationMonths}} мес.\\n\\nНастоящий трудовой договор регулируется внутренними политиками компании и трудовым законодательством.\\n\\nПодписано: {{contractDate}}",
      fields: JSON.parse(
        JSON.stringify([
          {
            key: "employeeName",
            label: "ФИО сотрудника",
            type: "text",
            required: true,
          },
          {
            key: "position",
            label: "Должность",
            type: "text",
            required: true,
          },
          {
            key: "department",
            label: "Отдел",
            type: "text",
            required: true,
          },
          {
            key: "startDate",
            label: "Дата начала работы",
            type: "date",
            required: true,
          },
          {
            key: "salary",
            label: "Ежемесячная зарплата (тг.)",
            type: "number",
            required: true,
          },
          {
            key: "workSchedule",
            label: "График работы",
            type: "text",
            required: false,
          },
          {
            key: "probationMonths",
            label: "Испытательный срок (мес.)",
            type: "number",
            required: false,
          },
          {
            key: "contractDate",
            label: "Дата договора",
            type: "date",
            required: true,
          },
        ]),
      ),
      createdById: admin.id,
    },
  });

  // Simple templates without fields (for backward compatibility)
  const budgetMemo = await prisma.template.create({
    data: {
      name: "Заявка на бюджет",
      description: "Запросы на выделение и пересмотр бюджета",
      createdById: admin.id,
    },
  });

  const licenseAgreement = await prisma.template.create({
    data: {
      name: "Лицензионное соглашение на ПО",
      description: "Лицензионные соглашения на программное обеспечение и SaaS",
      createdById: admin.id,
    },
  });

  // Create approval routes for templates
  console.log("🔄 Creating approval routes...");

  // Маршрут для Договора на оказание услуг: 3 этапа
  const serviceContractRoute = await prisma.approvalRoute.create({
    data: {
      name: "Согласование договора (3 этапа)",
      description: "Руководитель отдела → Юридический → Финансовый",
      templateId: serviceContract.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Согласование руководителем отдела",
            description: "Первичное согласование руководителем отдела",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "Юридическая проверка",
            description: "Проверка и согласование юридическим отделом",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
          {
            stepNumber: 3,
            name: "Финансовое согласование",
            description: "Финальное согласование финансовым отделом",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
        ],
      },
    },
  });

  // Маршрут для Соглашения о неразглашении: 2 этапа
  const ndaRoute = await prisma.approvalRoute.create({
    data: {
      name: "Согласование НДА (2 этапа)",
      description: "Юридический → Руководство",
      templateId: nda.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Юридическая проверка",
            description: "Проверка юридическим отделом",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "Согласование руководством",
            description: "Финальное согласование руководством",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
        ],
      },
    },
  });

  // Маршрут для Трудового договора: 2 этапа
  const hrContractRoute = await prisma.approvalRoute.create({
    data: {
      name: "Согласование трудового договора (2 этапа)",
      description: "HR + Финансы → Руководство",
      templateId: hrContract.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Проверка HR и Финансов",
            description: "HR и Финансы должны согласовать",
            approverIds: JSON.parse(
              JSON.stringify([admin.id]),
            ),
            requireAll: true,
          },
          {
            stepNumber: 2,
            name: "Согласование руководством",
            description: "Финальное согласование руководством",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
        ],
      },
    },
  });

  console.log("📄 Skipping document creation (will be created by users)...");

  console.log("✅ Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - Created ${await prisma.user.count()} users`);
  console.log(`   - Created ${await prisma.template.count()} templates`);
  console.log(
    `   - Created ${await prisma.approvalRoute.count()} approval routes`,
  );
  console.log("\n🔐 Default password: password123");
  console.log("\n👤 Users created:");
  console.log(`   - admin@edocsis.com (ADMIN)`);
  console.log("\n📋 Templates created:");
  console.log(`   - Договор на оказание услуг (10 полей) — 3 этапа`);
  console.log(`   - Соглашение о неразглашении (8 полей) — 2 этапа`);
  console.log(`   - Трудовой договор (8 полей) — 2 этапа`);
  console.log(`   - Заявка на бюджет`);
  console.log(`   - Лицензионное соглашение на ПО`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
