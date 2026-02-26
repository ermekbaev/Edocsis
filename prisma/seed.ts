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
      name: "Adil Kaliyev",
      email: "admin@edocsis.com",
      password: hashedPassword,
      role: "ADMIN",
      department: "IT",
    },
  });

  const approver1 = await prisma.user.create({
    data: {
      name: "Elena Volkova",
      email: "elena@edocsis.com",
      password: hashedPassword,
      role: "APPROVER",
      department: "Legal",
    },
  });

  const approver2 = await prisma.user.create({
    data: {
      name: "Boris Nikitin",
      email: "boris@edocsis.com",
      password: hashedPassword,
      role: "APPROVER",
      department: "Finance",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "Maria Kuznetsova",
      email: "maria@edocsis.com",
      password: hashedPassword,
      role: "USER",
      department: "HR",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Sergey Lebedev",
      email: "sergey@edocsis.com",
      password: hashedPassword,
      role: "USER",
      department: "Operations",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Dmitry Romanov",
      email: "dmitry@edocsis.com",
      password: hashedPassword,
      role: "USER",
      department: "Engineering",
    },
  });

  // Create templates with fields
  console.log("📋 Creating templates...");

  const serviceContract = await prisma.template.create({
    data: {
      name: "Service Contract",
      description: "Standard service contract template for vendor agreements",
      content: "SERVICE AGREEMENT\\n\\nDate: {{contractDate}}\\nClient: {{clientName}}\\nAddress: {{clientAddress}}\\n\\nServices: {{servicesDescription}}\\nAmount: ${{contractAmount}} USD\\nStart: {{startDate}}\\nEnd: {{endDate}}",
      fields: JSON.parse(JSON.stringify([
        { key: "contractDate", label: "Contract Date", type: "date", required: true },
        { key: "clientName", label: "Client Name", type: "text", required: true },
        { key: "clientAddress", label: "Client Address", type: "textarea", required: true },
        { key: "clientRegNumber", label: "Client Registration Number", type: "text", required: false },
        { key: "servicesDescription", label: "Services Description", type: "textarea", required: true },
        { key: "contractAmount", label: "Contract Amount (USD)", type: "number", required: true },
        { key: "paymentSchedule", label: "Payment Schedule", type: "text", required: false },
        { key: "paymentDueDate", label: "Payment Due Date", type: "date", required: true },
        { key: "startDate", label: "Contract Start Date", type: "date", required: true },
        { key: "endDate", label: "Contract End Date", type: "date", required: true },
      ])),
      createdById: admin.id,
    },
  });

  const nda = await prisma.template.create({
    data: {
      name: "Non-Disclosure Agreement",
      description: "Confidentiality agreement for business partnerships",
      content: "NON-DISCLOSURE AGREEMENT\\n\\nThis Non-Disclosure Agreement (\"Agreement\") is made on {{agreementDate}} between:\\n\\nDISCLOSING PARTY:\\nName: {{disclosingPartyName}}\\nAddress: {{disclosingPartyAddress}}\\n\\nRECEIVING PARTY:\\nName: {{receivingPartyName}}\\nAddress: {{receivingPartyAddress}}\\n\\nPURPOSE:\\n{{purposeDescription}}\\n\\n1. CONFIDENTIAL INFORMATION\\nThe parties agree to keep confidential all information shared during the collaboration period.\\n\\n2. OBLIGATIONS\\nDuration of confidentiality: {{confidentialityYears}} years\\nNon-disclosure obligations apply from: {{effectiveDate}}\\n\\n3. EXCLUSIONS\\nInformation that is publicly available is not considered confidential.\\n\\nSigned on: {{agreementDate}}",
      fields: JSON.parse(JSON.stringify([
        { key: "agreementDate", label: "Agreement Date", type: "date", required: true },
        { key: "disclosingPartyName", label: "Disclosing Party Name", type: "text", required: true },
        { key: "disclosingPartyAddress", label: "Disclosing Party Address", type: "textarea", required: true },
        { key: "receivingPartyName", label: "Receiving Party Name", type: "text", required: true },
        { key: "receivingPartyAddress", label: "Receiving Party Address", type: "textarea", required: true },
        { key: "purposeDescription", label: "Purpose of NDA", type: "textarea", required: true },
        { key: "confidentialityYears", label: "Confidentiality Period (years)", type: "number", required: true },
        { key: "effectiveDate", label: "Effective Date", type: "date", required: true },
      ])),
      createdById: admin.id,
    },
  });

  const hrContract = await prisma.template.create({
    data: {
      name: "Employment Contract",
      description: "Standard employment contract for new hires",
      content: "EMPLOYMENT CONTRACT\\n\\nEmployee Name: {{employeeName}}\\nPosition: {{position}}\\nDepartment: {{department}}\\n\\nStart Date: {{startDate}}\\nSalary: ${{salary}} USD per month\\n\\nWork Schedule: {{workSchedule}}\\nProbation Period: {{probationMonths}} months\\n\\nThis employment contract is subject to company policies and labor laws.\\n\\nSigned on: {{contractDate}}",
      fields: JSON.parse(JSON.stringify([
        { key: "employeeName", label: "Employee Full Name", type: "text", required: true },
        { key: "position", label: "Job Position", type: "text", required: true },
        { key: "department", label: "Department", type: "text", required: true },
        { key: "startDate", label: "Start Date", type: "date", required: true },
        { key: "salary", label: "Monthly Salary (USD)", type: "number", required: true },
        { key: "workSchedule", label: "Work Schedule", type: "text", required: false },
        { key: "probationMonths", label: "Probation Period (months)", type: "number", required: false },
        { key: "contractDate", label: "Contract Date", type: "date", required: true },
      ])),
      createdById: admin.id,
    },
  });

  // Simple templates without fields (for backward compatibility)
  const budgetMemo = await prisma.template.create({
    data: {
      name: "Budget Request",
      description: "Budget allocation and revision requests",
      createdById: admin.id,
    },
  });

  const licenseAgreement = await prisma.template.create({
    data: {
      name: "Software License Agreement",
      description: "Software and SaaS license agreements",
      createdById: admin.id,
    },
  });

  // Create approval routes for templates
  console.log("🔄 Creating approval routes...");

  // Route for Service Contract: 3 steps
  const serviceContractRoute = await prisma.approvalRoute.create({
    data: {
      name: "Standard Contract Approval (3 steps)",
      description: "Department Head → Legal → Finance approval workflow",
      templateId: serviceContract.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Department Head Approval",
            description: "Initial approval by department head",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "Legal Review",
            description: "Legal department review and approval",
            approverIds: JSON.parse(JSON.stringify([approver1.id])),
            requireAll: false,
          },
          {
            stepNumber: 3,
            name: "Financial Approval",
            description: "Final approval by finance department",
            approverIds: JSON.parse(JSON.stringify([approver2.id])),
            requireAll: false,
          },
        ],
      },
    },
  });

  // Route for NDA: 2 steps
  const ndaRoute = await prisma.approvalRoute.create({
    data: {
      name: "NDA Approval (2 steps)",
      description: "Legal → Management approval workflow",
      templateId: nda.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Legal Review",
            description: "Legal department review",
            approverIds: JSON.parse(JSON.stringify([approver1.id])),
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "Management Approval",
            description: "Final approval by management",
            approverIds: JSON.parse(JSON.stringify([admin.id])),
            requireAll: false,
          },
        ],
      },
    },
  });

  // Route for Employment Contract: 2 steps with parallel approval
  const hrContractRoute = await prisma.approvalRoute.create({
    data: {
      name: "HR Contract Approval (2 steps)",
      description: "HR + Finance (parallel) → Management approval workflow",
      templateId: hrContract.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "HR & Finance Review",
            description: "Both HR and Finance must approve",
            approverIds: JSON.parse(JSON.stringify([approver1.id, approver2.id])),
            requireAll: true, // Both must approve
          },
          {
            stepNumber: 2,
            name: "Management Approval",
            description: "Final approval by management",
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
  console.log(`   - Created ${await prisma.approvalRoute.count()} approval routes`);
  console.log("\n🔐 Default password for all users: password123");
  console.log("\n👤 Users created:");
  console.log(`   - admin@edocsis.com (ADMIN)`);
  console.log(`   - elena@edocsis.com (APPROVER)`);
  console.log(`   - boris@edocsis.com (APPROVER)`);
  console.log(`   - maria@edocsis.com (USER)`);
  console.log(`   - sergey@edocsis.com (USER)`);
  console.log(`   - dmitry@edocsis.com (USER)`);
  console.log("\n📋 Templates created:");
  console.log(`   - Service Contract (10 fields) - 3-step approval`);
  console.log(`   - Non-Disclosure Agreement (8 fields) - 2-step approval`);
  console.log(`   - Employment Contract (8 fields) - 2-step approval (parallel)`);
  console.log(`   - Budget Request`);
  console.log(`   - Software License Agreement`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
