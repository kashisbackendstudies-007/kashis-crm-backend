require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const Crew = require('../models/Crew');
const Vehicle = require('../models/Vehicle');
const Instrument = require('../models/Instrument');
const Site = require('../models/Site');
const Bill = require('../models/Bill');
const Expense = require('../models/Expense');
const Enquiry = require('../models/Enquiry');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      Client.deleteMany({}),
      Crew.deleteMany({}),
      Vehicle.deleteMany({}),
      Instrument.deleteMany({}),
      Site.deleteMany({}),
      Bill.deleteMany({}),
      Expense.deleteMany({}),
      Enquiry.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');
    
    // Update instrument status
    await Instrument.findByIdAndUpdate(instruments[0]._id, { status: 'in-use' });
    await Instrument.findByIdAndUpdate(instruments[1]._id, { status: 'in-use' });
    
    // Create Bills
    const bills = await Bill.create([
      {
        adminId: admin._id,
        customerId: clients[0]._id,
        siteIds: [sites[0]._id],
        billNumber: '909',
        billDate: new Date('2024-09-20'),
        isGSTBill: true,
        stateGST: 9,
        centralGST: 9,
        paymentStatus: 'UNPAID',
        notes: 'Setting out work completed',
        items: [
          {
            siteId: sites[0]._id,
            siteName: 'HILIFE LUXUS APARTMENTS',
            description: 'SETTING OUT 19/09/25',
            rate: 2000,
            amount: 2000
          }
        ]
      },
      {
        adminId: admin._id,
        customerId: clients[2]._id,
        siteIds: [sites[2]._id],
        billNumber: '908',
        billDate: new Date('2024-09-15'),
        isGSTBill: true,
        stateGST: 9,
        centralGST: 9,
        paymentStatus: 'PAID',
        notes: 'Full survey completed',
        items: [
          {
            siteId: sites[2]._id,
            siteName: 'Green Valley Resort',
            description: 'Complete topographic survey',
            rate: 15000,
            amount: 15000
          }
        ]
      }
    ]);
    console.log(`✅ Created ${bills.length} bills`);
    
    // Update site with bill reference
    await Site.findByIdAndUpdate(sites[0]._id, { billId: bills[0]._id });
    await Site.findByIdAndUpdate(sites[2]._id, { billId: bills[1]._id, status: 'BILL PAID' });
    
    // Create Expenses
    const expenses = await Expense.create([
      {
        adminId: admin._id,
        type: 'FUEL',
        siteId: sites[0]._id,
        amount: 1500,
        description: 'Diesel for site visit',
        expenseDate: new Date('2024-09-20')
      },
      {
        adminId: admin._id,
        type: 'FOOD',
        siteId: sites[0]._id,
        crewId: crews[0]._id,
        amount: 500,
        description: 'Crew lunch',
        expenseDate: new Date('2024-09-20')
      },
      {
        adminId: admin._id,
        type: 'SALARY',
        crewId: crews[0]._id,
        amount: 25000,
        description: 'Monthly salary - September',
        expenseDate: new Date('2024-09-30')
      },
      {
        adminId: admin._id,
        type: 'SALARY',
        crewId: crews[1]._id,
        amount: 23000,
        description: 'Monthly salary - September',
        expenseDate: new Date('2024-09-30')
      },
      {
        adminId: admin._id,
        type: 'SALARY',
        crewId: crews[2]._id,
        amount: 22000,
        description: 'Monthly salary - September',
        expenseDate: new Date('2024-09-30')
      },
      {
        adminId: admin._id,
        type: 'OTHERS',
        amount: 3500,
        description: 'Office supplies',
        expenseDate: new Date('2024-09-25')
      }
    ]);
    console.log(`✅ Created ${expenses.length} expenses`);
    
    // Create Enquiries
    const enquiries = await Enquiry.create([
      {
        adminId: admin._id,
        subject: 'New project inquiry - Commercial Complex',
        message: 'Need surveying services for a new commercial complex project in Thrissur',
        status: 'new',
        followUpDate: new Date('2024-10-25')
      },
      {
        adminId: admin._id,
        subject: 'Residential Plot Survey',
        message: 'Require plot survey for residential construction',
        status: 'in-progress',
        followUpDate: new Date('2024-10-22'),
        responseNotes: 'Called client, scheduled site visit'
      },
      {
        adminId: admin._id,
        subject: 'Industrial Area Mapping',
        message: 'Large scale mapping required for industrial area development',
        status: 'new',
        followUpDate: new Date('2024-10-28')
      }
    ]);
    console.log(`✅ Created ${enquiries.length} enquiries`);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('   Email: admin@hiland.com');
    console.log('   Password: password123');
    console.log('\n📊 Sample Data Created:');
    console.log(`   - ${clients.length} Clients`);
    console.log(`   - ${crews.length} Crew Members`);
    console.log(`   - ${vehicles.length} Vehicles`);
    console.log(`   - ${instruments.length} Instruments`);
    console.log(`   - ${sites.length} Sites`);
    console.log(`   - ${bills.length} Bills`);
    console.log(`   - ${expenses.length} Expenses`);
    console.log(`   - ${enquiries.length} Enquiries`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase(); Admin
    const admin = await Admin.create({
      email: 'admin@hiland.com',
      password: 'password123',
      name: 'Admin User'
    });
    console.log('👤 Created admin user');
    
    // Create Clients
    const clients = await Client.create([
      {
        adminId: admin._id,
        name: 'Creative Pile Foundation',
        email: 'contact@creative.com',
        phone: '9847007002',
        company: 'Creative Pile Foundation and Construction',
        address: 'Avanavu Road, Peramangalam P.O, Thrissur Kerala-680545',
        gstNumber: '32AAGFC4766P1Z1'
      },
      {
        adminId: admin._id,
        name: 'Tech Solutions Ltd',
        email: 'info@techsolutions.com',
        phone: '9876543210',
        company: 'Tech Solutions Limited',
        address: 'MG Road, Kochi, Kerala-682011',
        gstNumber: '32AABCT1234F1Z5'
      },
      {
        adminId: admin._id,
        name: 'Green Builders',
        email: 'contact@greenbuilders.com',
        phone: '9988776655',
        company: 'Green Builders Pvt Ltd',
        address: 'Kannur Road, Calicut, Kerala-673001'
      }
    ]);
    console.log(`✅ Created ${clients.length} clients`);
    
    // Create Crews
    const crews = await Crew.create([
      {
        adminId: admin._id,
        name: 'Rajesh Kumar',
        username: 'rajesh',
        password: 'crew123',
        isActive: true
      },
      {
        adminId: admin._id,
        name: 'Suresh Nair',
        username: 'suresh',
        password: 'crew123',
        isActive: true
      },
      {
        adminId: admin._id,
        name: 'Ramesh Pillai',
        username: 'ramesh',
        password: 'crew123',
        isActive: true
      }
    ]);
    console.log(`✅ Created ${crews.length} crew members`);
    
    // Create Vehicles
    const vehicles = await Vehicle.create([
      {
        adminId: admin._id,
        name: 'Survey Van 1',
        type: 'van',
        registrationNumber: 'KL-08-AB-1234',
        model: 'Toyota Hiace',
        year: 2020,
        status: 'active',
        insuranceExpiry: new Date('2025-12-31'),
        pollutionExpiry: new Date('2025-06-30'),
        serviceDueDate: new Date('2025-03-15')
      },
      {
        adminId: admin._id,
        name: 'Survey Car',
        type: 'car',
        registrationNumber: 'KL-08-CD-5678',
        model: 'Maruti Swift',
        year: 2021,
        status: 'active',
        insuranceExpiry: new Date('2025-11-30'),
        pollutionExpiry: new Date('2025-05-31')
      }
    ]);
    console.log(`✅ Created ${vehicles.length} vehicles`);
    
    // Create Instruments
    const instruments = await Instrument.create([
      {
        adminId: admin._id,
        name: 'Total Station',
        type: 'Surveying Equipment',
        serialNumber: 'TS-2024-001',
        status: 'available',
        lastServicedOn: new Date('2024-01-01')
      },
      {
        adminId: admin._id,
        name: 'GPS Device',
        type: 'Navigation Equipment',
        serialNumber: 'GPS-2024-001',
        status: 'available',
        lastServicedOn: new Date('2024-02-01')
      },
      {
        adminId: admin._id,
        name: 'Theodolite',
        type: 'Surveying Equipment',
        serialNumber: 'THD-2024-001',
        status: 'available',
        lastServicedOn: new Date('2024-01-15')
      }
    ]);
    console.log(`✅ Created ${instruments.length} instruments`);
    
    // Create Sites
    const sites = await Site.create([
      {
        adminId: admin._id,
        clientId: clients[0]._id,
        vehicleId: vehicles[0]._id,
        name: 'HILIFE LUXUS APARTMENTS',
        address: 'Punkunnam, Thrissur',
        city: 'Thrissur',
        state: 'Kerala',
        locationUrl: 'https://maps.google.com/',
        startDate: new Date('2024-09-15'),
        status: 'ON SITE COMPLETED',
        crewIds: [crews[0]._id, crews[1]._id],
        instrumentIds: [instruments[0]._id]
      },
      {
        adminId: admin._id,
        clientId: clients[1]._id,
        vehicleId: vehicles[1]._id,
        name: 'Tech Park Project',
        address: 'Infopark, Kakkanad',
        city: 'Kochi',
        state: 'Kerala',
        startDate: new Date('2024-10-01'),
        status: 'PENDING',
        crewIds: [crews[2]._id],
        instrumentIds: [instruments[1]._id]
      },
      {
        adminId: admin._id,
        clientId: clients[2]._id,
        vehicleId: vehicles[0]._id,
        name: 'Green Valley Resort',
        address: 'Wayanad Road',
        city: 'Calicut',
        state: 'Kerala',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-09-30'),
        status: 'PROJECT COMPLETED',
        crewIds: [crews[0]._id],
        instrumentIds: []
      }
    ]);
    console.log(`✅ Created ${sites.length} sites`);
    
    // Update instrument status
    await Instrument.findByIdAndUpdate(instruments[0]._id, { status: 'in-use' });
    await Instrument.findByIdAndUpdate(instruments[1]._id, { status: 'in-use' });
    
    // Create