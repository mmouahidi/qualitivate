import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('industries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.integer('order_index').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('slug');
  });

  await knex.schema.createTable('job_positions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('department', 255).notNullable();
    table.string('position', 255).notNullable();
    table.integer('order_index').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['department', 'position']);
  });

  // Seed industries (from organizational_data.xlsx - Industries sheet)
  const industries = [
    { name: 'Agriculture and fisheries', slug: 'agriculture-and-fisheries', order_index: 1 },
    { name: 'Mining and quarrying', slug: 'mining-and-quarrying', order_index: 2 },
    { name: 'Food products, beverage, and tobacco', slug: 'food-products-beverage-and-tobacco', order_index: 3 },
    { name: 'Textiles and textile products', slug: 'textiles-and-textile-products', order_index: 4 },
    { name: 'Leather and leather products', slug: 'leather-and-leather-products', order_index: 5 },
    { name: 'Wood and wood products', slug: 'wood-and-wood-products', order_index: 6 },
    { name: 'Pulp, paper, and paper products', slug: 'pulp-paper-and-paper-products', order_index: 7 },
    { name: 'Publishing companies', slug: 'publishing-companies', order_index: 8 },
    { name: 'Printing companies', slug: 'printing-companies', order_index: 9 },
    { name: 'Manufacture of coke and refined petroleum products', slug: 'manufacture-of-coke-and-refined-petroleum-products', order_index: 10 },
    { name: 'Nuclear fuel', slug: 'nuclear-fuel', order_index: 11 },
    { name: 'Chemicals, chemical products, and fibers', slug: 'chemicals-chemical-products-and-fibers', order_index: 12 },
    { name: 'Pharmaceuticals', slug: 'pharmaceuticals', order_index: 13 },
    { name: 'Rubber and plastic products', slug: 'rubber-and-plastic-products', order_index: 14 },
    { name: 'Non-metallic mineral products (Glass, ceramics, stone)', slug: 'non-metallic-mineral-products-glass-ceramics-stone', order_index: 15 },
    { name: 'Concrete, cement, lime, plaster, etc.', slug: 'concrete-cement-lime-plaster-etc', order_index: 16 },
    { name: 'Metal production', slug: 'metal-production', order_index: 17 },
    { name: 'Metal work and supply of metal products', slug: 'metal-work-and-supply-of-metal-products', order_index: 18 },
    { name: 'Machinery and equipment', slug: 'machinery-and-equipment', order_index: 19 },
    { name: 'Electrical and optical equipment', slug: 'electrical-and-optical-equipment', order_index: 20 },
    { name: 'Shipbuilding', slug: 'shipbuilding', order_index: 21 },
    { name: 'Aerospace', slug: 'aerospace', order_index: 22 },
    { name: 'Other transport equipment', slug: 'other-transport-equipment', order_index: 23 },
    { name: 'Manufacturing not elsewhere classified (Jewelry, furniture, toys)', slug: 'manufacturing-not-elsewhere-classified-jewelry-furniture-toys', order_index: 24 },
    { name: 'Recycling', slug: 'recycling', order_index: 25 },
    { name: 'Electricity supply', slug: 'electricity-supply', order_index: 26 },
    { name: 'Gas supply', slug: 'gas-supply', order_index: 27 },
    { name: 'Water supply', slug: 'water-supply', order_index: 28 },
    { name: 'Construction', slug: 'construction', order_index: 29 },
    { name: 'Wholesale and retail trade', slug: 'wholesale-and-retail-trade', order_index: 30 },
    { name: 'Maintenance and repair of motor vehicles and goods', slug: 'maintenance-and-repair-of-motor-vehicles-and-goods', order_index: 31 },
    { name: 'Hotels and restaurants', slug: 'hotels-and-restaurants', order_index: 32 },
    { name: 'Transport, storage, and communication', slug: 'transport-storage-and-communication', order_index: 33 },
    { name: 'Postage and Telecommunications', slug: 'postage-and-telecommunications', order_index: 34 },
    { name: 'Real Estate', slug: 'real-estate', order_index: 35 },
    { name: 'Renting, Credit, and Insurance services', slug: 'renting-credit-and-insurance-services', order_index: 36 },
    { name: 'Information technology', slug: 'information-technology', order_index: 37 },
    { name: 'Design and Development', slug: 'design-and-development', order_index: 38 },
    { name: 'Architecture and Engineering services', slug: 'architecture-and-engineering-services', order_index: 39 },
    { name: 'Professional services for companies', slug: 'professional-services-for-companies', order_index: 40 },
    { name: 'Public administration', slug: 'public-administration', order_index: 41 },
    { name: 'Education', slug: 'education', order_index: 42 },
    { name: 'Health, veterinary, and social work', slug: 'health-veterinary-and-social-work', order_index: 43 },
    { name: 'Other public and private services', slug: 'other-public-and-private-services', order_index: 44 },
  ];
  await knex('industries').insert(industries);

  // Seed job positions (from organizational_data.xlsx - Departments & Positions sheet)
  const jobPositions: { department: string; position: string; order_index: number }[] = [];
  const rawPositions = [
    ['Executive Office', 'Chief Executive Officer (CEO)'],
    ['Executive Office', 'Chief Operating Officer (COO)'],
    ['Executive Office', 'Chief of Staff'],
    ['Executive Office', 'Executive Assistant'],
    ['Corporate Strategy', 'Chief Strategy Officer (CSO)'],
    ['Corporate Strategy', 'Strategy Manager'],
    ['Corporate Strategy', 'Mergers & Acquisitions (M&A) Analyst'],
    ['Governance & Ethics', 'Board Secretary'],
    ['Governance & Ethics', 'Chief Compliance Officer (CCO)'],
    ['Governance & Ethics', 'Ethics Officer'],
    ['Manufacturing / Production', 'Plant Manager'],
    ['Manufacturing / Production', 'Production Supervisor'],
    ['Manufacturing / Production', 'Line Operator'],
    ['Manufacturing / Production', 'Machinist'],
    ['Maintenance & Engineering', 'Maintenance Manager'],
    ['Maintenance & Engineering', 'Reliability Engineer'],
    ['Maintenance & Engineering', 'Facilities Technician'],
    ['Process Engineering', 'Process Engineer'],
    ['Process Engineering', 'Continuous Improvement Lead'],
    ['Process Engineering', 'Lean Six Sigma Black Belt'],
    ['Quality Assurance (QA)', 'QA Manager'],
    ['Quality Assurance (QA)', 'Quality Systems Auditor'],
    ['Quality Assurance (QA)', 'Compliance Specialist'],
    ['Quality Control (QC)', 'QC Manager'],
    ['Quality Control (QC)', 'Lab Technician'],
    ['Quality Control (QC)', 'Microbiologist / Chemist'],
    ['Quality Control (QC)', 'Final Inspector'],
    ['Health, Safety & Environment (HSE)', 'HSE Director'],
    ['Health, Safety & Environment (HSE)', 'Safety Officer'],
    ['Health, Safety & Environment (HSE)', 'Environmental Specialist'],
    ['R&D', 'R&D Director'],
    ['R&D', 'Senior Scientist'],
    ['R&D', 'Product Developer'],
    ['R&D', 'Lab Researcher'],
    ['Innovation Lab', 'Chief Innovation Officer (CINO)'],
    ['Innovation Lab', 'Innovation Lead'],
    ['Innovation Lab', 'Digital Transformation Manager'],
    ['Regulatory Affairs', 'Regulatory Affairs Manager'],
    ['Regulatory Affairs', 'Labeling Specialist'],
    ['Regulatory Affairs', 'Documentation Coordinator'],
    ['Procurement', 'Chief Procurement Officer (CPO)'],
    ['Procurement', 'Purchasing Manager'],
    ['Procurement', 'Strategic Sourcing Specialist'],
    ['Procurement', 'Buyer'],
    ['Logistics & Distribution', 'Logistics Manager'],
    ['Logistics & Distribution', 'Fleet Manager'],
    ['Logistics & Distribution', 'Dispatcher / Route Planner'],
    ['Warehousing & Inventory', 'Warehouse Manager'],
    ['Warehousing & Inventory', 'Inventory Controller'],
    ['Warehousing & Inventory', 'Stock Clerk / Forklift Operator'],
    ['Supply Chain Planning', 'Demand Planner'],
    ['Supply Chain Planning', 'Supply Chain Analyst'],
    ['Supply Chain Planning', 'Production Planner'],
    ['Sales', 'VP of Sales'],
    ['Sales', 'Sales Manager'],
    ['Sales', 'Account Executive'],
    ['Sales', 'Business Development Manager (BDM)'],
    ['Marketing & Brand', 'Chief Marketing Officer (CMO)'],
    ['Marketing & Brand', 'Brand Manager'],
    ['Marketing & Brand', 'Digital Marketing Specialist'],
    ['Marketing & Brand', 'Content Creator / Graphic Designer'],
    ['Public Relations & Communications', 'Communications Director'],
    ['Public Relations & Communications', 'PR Manager'],
    ['Public Relations & Communications', 'Social Media Manager'],
    ['Customer Success & Support', 'Customer Success Manager (CSM)'],
    ['Customer Success & Support', 'Account Manager'],
    ['Customer Success & Support', 'Customer Service Representative'],
    ['Customer Success & Support', 'Technical Support Specialist'],
    ['Accounting', 'Chief Financial Officer (CFO)'],
    ['Accounting', 'Financial Controller'],
    ['Accounting', 'General Accountant'],
    ['Accounting', 'Accounts Payable/Receivable Clerk'],
    ['Financial Planning & Analysis (FP&A)', 'FP&A Manager'],
    ['Financial Planning & Analysis (FP&A)', 'Budget Analyst'],
    ['Financial Planning & Analysis (FP&A)', 'Financial Modeler'],
    ['Legal & Risk', 'General Counsel'],
    ['Legal & Risk', 'Legal Counsel'],
    ['Legal & Risk', 'Paralegal'],
    ['Legal & Risk', 'Risk Manager'],
    ['Facilities & Security', 'Facilities Manager'],
    ['Facilities & Security', 'Office Manager'],
    ['Facilities & Security', 'Security Coordinator'],
    ['HR Management', 'HR Director'],
    ['HR Management', 'HR Generalist'],
    ['HR Management', 'Employee Relations Manager'],
    ['Talent Acquisition', 'Recruitment Manager'],
    ['Talent Acquisition', 'Technical Recruiter'],
    ['Talent Acquisition', 'Talent Sourcer'],
    ['Learning & Development (L&D)', 'L&D Manager'],
    ['Learning & Development (L&D)', 'Corporate Trainer'],
    ['Learning & Development (L&D)', 'Instructional Designer'],
    ['Payroll & Benefits', 'Payroll Manager'],
    ['Payroll & Benefits', 'Compensation & Benefits Specialist'],
    ['IT Operations', 'Chief Technology Officer (CTO)'],
    ['IT Operations', 'IT Manager'],
    ['IT Operations', 'System Administrator'],
    ['IT Operations', 'Help Desk Technician'],
    ['Software Engineering', 'VP of Engineering'],
    ['Software Engineering', 'Software Architect'],
    ['Software Engineering', 'Full-Stack / Backend / Frontend Developer'],
    ['Software Engineering', 'DevOps Engineer'],
    ['Data & Analytics', 'Chief Data Officer (CDO)'],
    ['Data & Analytics', 'Data Scientist'],
    ['Data & Analytics', 'Data Analyst'],
    ['Data & Analytics', 'Business Intelligence (BI) Developer'],
    ['Cybersecurity', 'Chief Information Security Officer (CISO)'],
    ['Cybersecurity', 'Security Engineer'],
    ['Cybersecurity', 'SOC Analyst'],
  ];
  rawPositions.forEach(([department, position], idx) => {
    jobPositions.push({ department, position, order_index: idx + 1 });
  });
  await knex('job_positions').insert(jobPositions);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_positions');
  await knex.schema.dropTableIfExists('industries');
}
