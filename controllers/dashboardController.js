// Add these methods to dashboardController.js

// @desc    Get revenue chart data
// @route   GET /v1/dashboard/revenue-chart
// @access  Private
exports.getRevenueChart = async (req, res) => {
  try {
    const { period = '30days', groupBy } = req.query;
    const adminId = req.admin._id;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    let autoGroupBy = 'day';
    
    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        autoGroupBy = 'day';
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        autoGroupBy = 'day';
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        autoGroupBy = 'week';
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        autoGroupBy = 'month';
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        autoGroupBy = 'month';
        break;
      case 'all':
        startDate = null;
        autoGroupBy = 'month';
        break;
    }
    
    const finalGroupBy = groupBy || autoGroupBy;
    
    const query = { adminId };
    if (startDate) {
      query.billDate = { $gte: startDate, $lte: endDate };
    }
    
    const [bills, expenses] = await Promise.all([
      require('../models/Bill').find(query),
      require('../models/Expense').find({
        adminId,
        ...(startDate && { expenseDate: { $gte: startDate, $lte: endDate } })
      })
    ]);
    
    // Group data
    const dataMap = new Map();
    
    bills.forEach(bill => {
      const key = getDateKey(bill.billDate, finalGroupBy);
      const existing = dataMap.get(key) || { date: key, revenue: 0, expenses: 0, profit: 0, billCount: 0 };
      existing.revenue += bill.totalAmount;
      existing.billCount++;
      dataMap.set(key, existing);
    });
    
    expenses.forEach(expense => {
      const key = getDateKey(expense.expenseDate, finalGroupBy);
      const existing = dataMap.get(key) || { date: key, revenue: 0, expenses: 0, profit: 0, billCount: 0 };
      existing.expenses += expense.amount;
      dataMap.set(key, existing);
    });
    
    // Calculate profit
    dataMap.forEach(data => {
      data.profit = data.revenue - data.expenses;
    });
    
    const data = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    const totals = data.reduce((acc, item) => ({
      revenue: acc.revenue + item.revenue,
      expenses: acc.expenses + item.expenses,
      profit: acc.profit + item.profit,
      billCount: acc.billCount + item.billCount
    }), { revenue: 0, expenses: 0, profit: 0, billCount: 0 });
    
    res.status(200).json({
      success: true,
      data: {
        period,
        groupBy: finalGroupBy,
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate.toISOString().split('T')[0],
        data,
        totals
      }
    });
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

// @desc    Get site status distribution
// @route   GET /v1/dashboard/site-status-distribution
// @access  Private
exports.getSiteStatusDistribution = async (req, res) => {
  try {
    const sites = await require('../models/Site').find({ adminId: req.admin._id });
    
    const distribution = sites.reduce((acc, site) => {
      acc[site.status] = (acc[site.status] || 0) + 1;
      return acc;
    }, {});
    
    const data = Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / sites.length) * 100).toFixed(1)
    }));
    
    res.status(200).json({
      success: true,
      data,
      total: sites.length
    });
  } catch (error) {
    console.error('Site status distribution error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

// @desc    Get expense breakdown
// @route   GET /v1/dashboard/expense-breakdown
// @access  Private
exports.getExpenseBreakdown = async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const query = { adminId: req.admin._id };
    
    if (period !== 'all') {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }
      
      query.expenseDate = { $gte: startDate, $lte: endDate };
    }
    
    const expenses = await require('../models/Expense').find(query);
    
    const byType = expenses.reduce((acc, expense) => {
      if (!acc[expense.type]) {
        acc[expense.type] = { amount: 0, count: 0 };
      }
      acc[expense.type].amount += expense.amount;
      acc[expense.type].count++;
      return acc;
    }, {});
    
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const data = Object.entries(byType).map(([type, data]) => ({
      type,
      amount: data.amount,
      percentage: ((data.amount / total) * 100).toFixed(2),
      count: data.count
    }));
    
    res.status(200).json({
      success: true,
      data: {
        period,
        byType: data,
        total
      }
    });
  } catch (error) {
    console.error('Expense breakdown error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

// @desc    Get top clients
// @route   GET /v1/dashboard/top-clients
// @access  Private
exports.getTopClients = async (req, res) => {
  try {
    const { limit = 10, sortBy = 'revenue' } = req.query;
    const adminId = req.admin._id;
    
    const clients = await require('../models/Client').find({ adminId });
    const sites = await require('../models/Site').find({ adminId });
    const bills = await require('../models/Bill').find({ adminId }).populate('customerId');
    
    const clientStats = clients.map(client => {
      const clientSites = sites.filter(s => s.clientId && s.clientId.toString() === client._id.toString());
      const clientBills = bills.filter(b => b.customerId && b.customerId._id.toString() === client._id.toString());
      
      const totalRevenue = clientBills.reduce((sum, b) => sum + b.totalAmount, 0);
      const paidAmount = clientBills
        .filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + b.totalAmount, 0);
      
      return {
        id: client._id,
        name: client.name,
        company: client.company,
        totalProjects: clientSites.length,
        completedProjects: clientSites.filter(s => s.status === 'PROJECT COMPLETED').length,
        activeProjects: clientSites.filter(s => s.status !== 'PROJECT COMPLETED').length,
        totalRevenue,
        paidAmount,
        pendingAmount: totalRevenue - paidAmount
      };
    });
    
    // Sort by revenue or projects
    const sorted = clientStats.sort((a, b) => {
      if (sortBy === 'projects') {
        return b.totalProjects - a.totalProjects;
      }
      return b.totalRevenue - a.totalRevenue;
    });
    
    res.status(200).json({
      success: true,
      data: sorted.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Top clients error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

// Helper function to get date key based on grouping
function getDateKey(date, groupBy) {
  const d = new Date(date);
  
  switch (groupBy) {
    case 'day':
      return d.toISOString().split('T')[0];
    case 'week':
      const year = d.getFullYear();
      const week = getWeekNumber(d);
      return `${year}-W${week.toString().padStart(2, '0')}`;
    case 'month':
      return d.toISOString().slice(0, 7);
    case 'year':
      return d.getFullYear().toString();
    default:
      return d.toISOString().split('T')[0];
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}