import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎨 Creating full-featured templates...");

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    throw new Error("No admin user found. Please run seed first.");
  }

  // Get approvers
  const approvers = await prisma.user.findMany({
    where: { role: "APPROVER" },
  });

  if (approvers.length < 2) {
    throw new Error("Need at least 2 approvers. Please run seed first.");
  }

  const [legalApprover, financeApprover] = approvers;

  console.log(`✅ Found admin: ${admin.email}`);
  console.log(`✅ Found approvers: ${approvers.map((a) => a.email).join(", ")}`);

  // Delete existing templates to avoid duplicates
  await prisma.template.deleteMany();
  console.log("🗑️  Cleared existing templates");

  // 1. Purchase Order Template
  const purchaseOrder = await prisma.template.create({
    data: {
      name: "Purchase Order",
      description: "Official purchase order for procurement of goods and services from external vendors",
      content: "PURCHASE ORDER\n\nOrder Number: {{orderNumber}}\nDate: {{orderDate}}\n\nVENDOR INFORMATION\nVendor Name: {{vendorName}}\nVendor Address: {{vendorAddress}}\nContact Person: {{vendorContact}}\n\nDELIVERY INFORMATION\nDelivery Address: {{deliveryAddress}}\nRequired by Date: {{requiredDate}}\n\nITEMS\n{{itemsDescription}}\n\nTOTAL AMOUNT: ${{totalAmount}} USD\n\nPayment Terms: {{paymentTerms}}\nSpecial Instructions: {{specialInstructions}}",
      fields: [
        { key: "orderNumber", label: "Order Number", type: "text", required: true },
        { key: "orderDate", label: "Order Date", type: "date", required: true },
        { key: "vendorName", label: "Vendor Name", type: "text", required: true },
        { key: "vendorAddress", label: "Vendor Address", type: "textarea", required: true },
        { key: "vendorContact", label: "Vendor Contact", type: "text", required: false },
        { key: "deliveryAddress", label: "Delivery Address", type: "textarea", required: true },
        { key: "requiredDate", label: "Required by Date", type: "date", required: true },
        { key: "itemsDescription", label: "Items Description", type: "textarea", required: true },
        { key: "totalAmount", label: "Total Amount (USD)", type: "number", required: true },
        { key: "paymentTerms", label: "Payment Terms", type: "text", required: true },
        { key: "specialInstructions", label: "Special Instructions", type: "textarea", required: false },
      ],
      createdById: admin.id,
    },
  });

  // Create 3-step approval route for Purchase Order
  await prisma.approvalRoute.create({
    data: {
      name: "Purchase Order Approval (3 steps)",
      description: "Department → Finance → Management approval",
      templateId: purchaseOrder.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Department Approval",
            description: "Department head reviews the purchase request",
            approverIds: [admin.id],
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "Finance Review",
            description: "Finance department verifies budget and approves",
            approverIds: [financeApprover.id],
            requireAll: false,
          },
          {
            stepNumber: 3,
            name: "Management Sign-off",
            description: "Final approval from management",
            approverIds: [legalApprover.id],
            requireAll: false,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${purchaseOrder.name} (11 fields, 3-step approval)`);

  // 2. Vacation Request Template
  const vacationRequest = await prisma.template.create({
    data: {
      name: "Vacation Request",
      description: "Employee vacation and leave request form for HR approval",
      content: "VACATION REQUEST FORM\n\nEmployee Name: {{employeeName}}\nEmployee ID: {{employeeId}}\nDepartment: {{department}}\nPosition: {{position}}\n\nLEAVE DETAILS\nLeave Type: {{leaveType}}\nStart Date: {{startDate}}\nEnd Date: {{endDate}}\nTotal Days: {{totalDays}}\nReason: {{reason}}\n\nCONTACT DURING LEAVE\nContact Phone: {{contactPhone}}\nContact Email: {{contactEmail}}\n\nI confirm that I have completed handover of my responsibilities.\n\nDate: {{requestDate}}",
      fields: [
        { key: "employeeName", label: "Employee Full Name", type: "text", required: true },
        { key: "employeeId", label: "Employee ID", type: "text", required: true },
        { key: "department", label: "Department", type: "text", required: true },
        { key: "position", label: "Position", type: "text", required: true },
        { key: "leaveType", label: "Leave Type", type: "text", required: true },
        { key: "startDate", label: "Start Date", type: "date", required: true },
        { key: "endDate", label: "End Date", type: "date", required: true },
        { key: "totalDays", label: "Total Days", type: "number", required: true },
        { key: "reason", label: "Reason for Leave", type: "textarea", required: false },
        { key: "contactPhone", label: "Contact Phone", type: "text", required: true },
        { key: "contactEmail", label: "Contact Email", type: "text", required: true },
        { key: "requestDate", label: "Request Date", type: "date", required: true },
      ],
      createdById: admin.id,
    },
  });

  // Create 2-step approval route for Vacation Request
  await prisma.approvalRoute.create({
    data: {
      name: "Vacation Request Approval (2 steps)",
      description: "Department Head → HR approval",
      templateId: vacationRequest.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Department Head Approval",
            description: "Direct manager approves leave request",
            approverIds: [admin.id],
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "HR Approval",
            description: "HR department final approval",
            approverIds: [legalApprover.id],
            requireAll: false,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${vacationRequest.name} (12 fields, 2-step approval)`);

  // 3. Expense Reimbursement Template
  const expenseReimbursement = await prisma.template.create({
    data: {
      name: "Expense Reimbursement",
      description: "Business expense reimbursement claim for work-related expenses",
      content: "EXPENSE REIMBURSEMENT CLAIM\n\nEmployee: {{employeeName}}\nDepartment: {{department}}\nClaim Date: {{claimDate}}\n\nEXPENSE DETAILS\nExpense Type: {{expenseType}}\nDate of Expense: {{expenseDate}}\nMerchant/Vendor: {{merchant}}\nDescription: {{description}}\n\nAmount: ${{amount}} USD\nCurrency: {{currency}}\n\nBUSINESS PURPOSE\nPurpose: {{businessPurpose}}\nProject/Cost Center: {{costCenter}}\n\nReceipt Attached: Yes\n\nPayment Method: {{paymentMethod}}\nAccount Number: {{accountNumber}}",
      fields: [
        { key: "employeeName", label: "Employee Name", type: "text", required: true },
        { key: "department", label: "Department", type: "text", required: true },
        { key: "claimDate", label: "Claim Date", type: "date", required: true },
        { key: "expenseType", label: "Expense Type", type: "text", required: true },
        { key: "expenseDate", label: "Date of Expense", type: "date", required: true },
        { key: "merchant", label: "Merchant/Vendor", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea", required: true },
        { key: "amount", label: "Amount (USD)", type: "number", required: true },
        { key: "currency", label: "Currency", type: "text", required: true },
        { key: "businessPurpose", label: "Business Purpose", type: "textarea", required: true },
        { key: "costCenter", label: "Project/Cost Center", type: "text", required: false },
        { key: "paymentMethod", label: "Payment Method", type: "text", required: true },
        { key: "accountNumber", label: "Account Number", type: "text", required: false },
      ],
      createdById: admin.id,
    },
  });

  // Create 2-step approval route for Expense Reimbursement
  await prisma.approvalRoute.create({
    data: {
      name: "Expense Reimbursement Approval (2 steps)",
      description: "Manager → Finance approval",
      templateId: expenseReimbursement.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Manager Approval",
            description: "Direct manager reviews and approves expense",
            approverIds: [admin.id],
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "Finance Approval",
            description: "Finance department processes reimbursement",
            approverIds: [financeApprover.id],
            requireAll: false,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${expenseReimbursement.name} (13 fields, 2-step approval)`);

  // 4. IT Access Request Template
  const itAccessRequest = await prisma.template.create({
    data: {
      name: "IT Access Request",
      description: "Request for system access, software licenses, or IT resources",
      content: "IT ACCESS REQUEST\n\nRequester: {{requesterName}}\nDepartment: {{department}}\nManager: {{managerName}}\nRequest Date: {{requestDate}}\n\nACCESS REQUEST DETAILS\nSystem/Application: {{systemName}}\nAccess Type: {{accessType}}\nAccess Level: {{accessLevel}}\n\nJUSTIFICATION\nBusiness Justification: {{justification}}\nDuration: {{duration}}\n\nADDITIONAL INFORMATION\nStart Date: {{startDate}}\nEnd Date (if temporary): {{endDate}}\nSpecial Requirements: {{specialRequirements}}",
      fields: [
        { key: "requesterName", label: "Requester Name", type: "text", required: true },
        { key: "department", label: "Department", type: "text", required: true },
        { key: "managerName", label: "Manager Name", type: "text", required: true },
        { key: "requestDate", label: "Request Date", type: "date", required: true },
        { key: "systemName", label: "System/Application", type: "text", required: true },
        { key: "accessType", label: "Access Type", type: "text", required: true },
        { key: "accessLevel", label: "Access Level", type: "text", required: true },
        { key: "justification", label: "Business Justification", type: "textarea", required: true },
        { key: "duration", label: "Duration", type: "text", required: true },
        { key: "startDate", label: "Start Date", type: "date", required: true },
        { key: "endDate", label: "End Date (if temporary)", type: "date", required: false },
        { key: "specialRequirements", label: "Special Requirements", type: "textarea", required: false },
      ],
      createdById: admin.id,
    },
  });

  // Create 2-step approval route for IT Access Request
  await prisma.approvalRoute.create({
    data: {
      name: "IT Access Request Approval (2 steps)",
      description: "Manager → IT Security approval",
      templateId: itAccessRequest.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Manager Approval",
            description: "Direct manager approves access request",
            approverIds: [admin.id],
            requireAll: false,
          },
          {
            stepNumber: 2,
            name: "IT Security Approval",
            description: "IT security team reviews and grants access",
            approverIds: [legalApprover.id],
            requireAll: false,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${itAccessRequest.name} (12 fields, 2-step approval)`);

  // 5. Meeting Room Booking Template
  const meetingRoomBooking = await prisma.template.create({
    data: {
      name: "Meeting Room Booking",
      description: "Reserve meeting rooms and conference facilities",
      content: "MEETING ROOM BOOKING REQUEST\n\nOrganizer: {{organizerName}}\nDepartment: {{department}}\nEmail: {{email}}\nPhone: {{phone}}\n\nMEETING DETAILS\nMeeting Title: {{meetingTitle}}\nDate: {{meetingDate}}\nStart Time: {{startTime}}\nEnd Time: {{endTime}}\nDuration: {{duration}} hours\n\nROOM PREFERENCES\nRoom Name: {{roomName}}\nExpected Attendees: {{attendeeCount}}\n\nEQUIPMENT REQUIRED\n{{equipmentRequired}}\n\nCATERING\nCatering Required: {{cateringRequired}}\nCatering Details: {{cateringDetails}}\n\nPurpose: {{purpose}}",
      fields: [
        { key: "organizerName", label: "Organizer Name", type: "text", required: true },
        { key: "department", label: "Department", type: "text", required: true },
        { key: "email", label: "Email", type: "text", required: true },
        { key: "phone", label: "Phone", type: "text", required: false },
        { key: "meetingTitle", label: "Meeting Title", type: "text", required: true },
        { key: "meetingDate", label: "Meeting Date", type: "date", required: true },
        { key: "startTime", label: "Start Time", type: "text", required: true },
        { key: "endTime", label: "End Time", type: "text", required: true },
        { key: "duration", label: "Duration (hours)", type: "number", required: true },
        { key: "roomName", label: "Room Name", type: "text", required: true },
        { key: "attendeeCount", label: "Expected Attendees", type: "number", required: true },
        { key: "equipmentRequired", label: "Equipment Required", type: "textarea", required: false },
        { key: "cateringRequired", label: "Catering Required (Yes/No)", type: "text", required: false },
        { key: "cateringDetails", label: "Catering Details", type: "textarea", required: false },
        { key: "purpose", label: "Purpose of Meeting", type: "textarea", required: true },
      ],
      createdById: admin.id,
    },
  });

  // Create 1-step approval route for Meeting Room Booking
  await prisma.approvalRoute.create({
    data: {
      name: "Meeting Room Booking Approval (1 step)",
      description: "Facilities Management approval",
      templateId: meetingRoomBooking.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: "Facilities Approval",
            description: "Facilities team confirms availability and approves",
            approverIds: [admin.id],
            requireAll: false,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${meetingRoomBooking.name} (15 fields, 1-step approval)`);

  // Summary
  const totalTemplates = await prisma.template.count();
  const totalRoutes = await prisma.approvalRoute.count();

  console.log("\n✅ Template creation completed!");
  console.log(`📊 Total templates: ${totalTemplates}`);
  console.log(`🔄 Total approval routes: ${totalRoutes}`);
  console.log("\n📋 Created templates:");
  console.log("  1. Purchase Order (11 fields, 3-step approval)");
  console.log("  2. Vacation Request (12 fields, 2-step approval)");
  console.log("  3. Expense Reimbursement (13 fields, 2-step approval)");
  console.log("  4. IT Access Request (12 fields, 2-step approval)");
  console.log("  5. Meeting Room Booking (15 fields, 1-step approval)");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
