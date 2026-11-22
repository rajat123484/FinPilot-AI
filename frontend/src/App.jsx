import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { FraudDetectionPage } from './pages/FraudDetectionPage';
import { BudgetPlannerPage } from './pages/BudgetPlannerPage';
import { FinancialAnalyticsPage } from './pages/FinancialAnalyticsPage';
import { BankAnalyzerPage } from './pages/BankAnalyzerPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

export function App() {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchAlerts = async () => {
        try {
          const res = await api.fraud.getOverview();
          setActiveAlertCount(res.flagged_count || 0);
        } catch (e) {
          // Ignore background fetch error
        }
      };
      fetchAlerts();
    }
  }, [isAuthenticated, activePage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Initializing FinPilot AI...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            setActivePage={setActivePage}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        );
      case 'transactions':
        return (
          <TransactionsPage
            isModalOpen={isAddModalOpen}
            setIsModalOpen={setIsAddModalOpen}
          />
        );
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'fraud-detection':
        return <FraudDetectionPage />;
      case 'budget-planner':
        return <BudgetPlannerPage />;
      case 'analytics':
        return <FinancialAnalyticsPage />;
      case 'bank-analyzer':
        return <BankAnalyzerPage setActivePage={setActivePage} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setActivePage={setActivePage} onOpenAddModal={() => setIsAddModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar
          activePage={activePage}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
