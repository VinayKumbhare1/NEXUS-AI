import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { MachineMonitoring } from './components/machines/MachineMonitoring';
import { AIPredictionModule } from './components/predictions/AIPredictionModule';
import { MaintenanceAlerts } from './components/alerts/MaintenanceAlerts';
import { AnalyticsModule } from './components/analytics/AnalyticsModule';
import { PredictionHistory } from './components/history/PredictionHistory';
import { DatasetManagement } from './components/datasets/DatasetManagement';
import { ModelPerformance } from './components/model/ModelPerformance';
import { SettingsModule } from './components/settings/SettingsModule';
import { NavigationTab, Machine, Alert, PredictionRecord, ModelPerformanceData } from './types';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState('Gigafactory 01 - Detroit Hub');
  const [searchQuery, setSearchQuery] = useState('');

  // Application Data States
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [modelData, setModelData] = useState<ModelPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Machine Detail & Diagnostics Selection
  const [selectedMachineForDetail, setSelectedMachineForDetail] = useState<Machine | null>(null);
  const [machineForDiagnostics, setMachineForDiagnostics] = useState<Machine | null>(null);

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedMachines, loadedAlerts, loadedPredictions, loadedModel] = await Promise.all([
          api.getMachines(),
          api.getAlerts(),
          api.getPredictions(),
          api.getModelInfo()
        ]);
        setMachines(loadedMachines);
        setAlerts(loadedAlerts);
        setPredictions(loadedPredictions);
        setModelData(loadedModel);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Machine Actions
  const handleAddMachine = async (machineData: Partial<Machine>) => {
    try {
      const created = await api.createMachine(machineData);
      setMachines(prev => [created, ...prev]);
    } catch (e: any) {
      alert(e.message || 'Error creating machine');
    }
  };

  const handleUpdateMachine = async (id: string, updates: Partial<Machine>) => {
    try {
      const updated = await api.updateMachine(id, updates);
      setMachines(prev => prev.map(m => m.id === id ? updated : m));
      if (selectedMachineForDetail?.id === id) {
        setSelectedMachineForDetail(updated);
      }
    } catch (e: any) {
      alert(e.message || 'Error updating machine');
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (!window.confirm(`Are you sure you want to decommission and remove machine ${id}?`)) {
      return;
    }
    try {
      await api.deleteMachine(id);
      setMachines(prev => prev.filter(m => m.id !== id));
      if (selectedMachineForDetail?.id === id) {
        setSelectedMachineForDetail(null);
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting machine');
    }
  };

  // Run Diagnostics Flow
  const handleRunDiagnostics = (machine: Machine) => {
    setMachineForDiagnostics(machine);
    setCurrentTab('predictions');
  };

  // Alert Actions
  const handleResolveAlert = async (id: string) => {
    try {
      const resolved = await api.resolveAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? resolved : a));
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleReopenAlert = async (id: string) => {
    try {
      const reopened = await api.reopenAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? reopened : a));
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateAlert = async (alertData: Partial<Alert>) => {
    try {
      const created = await api.createAlert(alertData);
      setAlerts(prev => [created, ...prev]);
    } catch (e: any) {
      console.error(e);
    }
  };

  // Prediction Actions
  const handleSavePrediction = async (predictionData: Partial<PredictionRecord>) => {
    try {
      const saved = await api.createPrediction(predictionData);
      setPredictions(prev => [saved, ...prev]);
      // Refresh alerts if a critical failure prediction generated an alert
      const refreshedAlerts = await api.getAlerts();
      setAlerts(refreshedAlerts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePrediction = async (id: string) => {
    try {
      await api.deletePrediction(id);
      setPredictions(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#080B16] text-[#F8FAFC] tech-grid-bg">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeAlertCount={activeAlertCount}
      />

      {/* Top Navigation Bar */}
      <TopNavbar
        sidebarCollapsed={sidebarCollapsed}
        selectedFactory={selectedFactory}
        onSelectFactory={setSelectedFactory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        alerts={alerts}
        onOpenAlerts={() => setCurrentTab('alerts')}
        onNavigateToPredictions={() => setCurrentTab('predictions')}
      />

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[2px] animate-spin">
              <div className="w-full h-full bg-[#080B16] rounded-2xl" />
            </div>
            <p className="text-xs font-mono text-cyan-400 tracking-wider uppercase animate-pulse">
              INITIALIZING NEXUS AI SENSOR BUS & NEURAL CORE...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'overview' && (
              <OverviewDashboard
                machines={machines}
                alerts={alerts}
                predictions={predictions}
                onNavigate={setCurrentTab}
                onSelectMachine={(m) => setSelectedMachineForDetail(m)}
              />
            )}

            {currentTab === 'machines' && (
              <MachineMonitoring
                machines={machines}
                onAddMachine={handleAddMachine}
                onUpdateMachine={handleUpdateMachine}
                onDeleteMachine={handleDeleteMachine}
                onRunDiagnostics={handleRunDiagnostics}
                selectedMachineForDetail={selectedMachineForDetail}
                onCloseDetailModal={() => setSelectedMachineForDetail(null)}
                onOpenDetailModal={(m) => setSelectedMachineForDetail(m)}
              />
            )}

            {currentTab === 'predictions' && (
              <AIPredictionModule
                machines={machines}
                onSavePrediction={handleSavePrediction}
                preselectedMachine={machineForDiagnostics}
              />
            )}

            {currentTab === 'alerts' && (
              <MaintenanceAlerts
                alerts={alerts}
                onResolveAlert={handleResolveAlert}
                onReopenAlert={handleReopenAlert}
                onCreateAlert={handleCreateAlert}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsModule
                machines={machines}
                alerts={alerts}
                predictions={predictions}
              />
            )}

            {currentTab === 'history' && (
              <PredictionHistory
                predictions={predictions}
                onDeletePrediction={handleDeletePrediction}
              />
            )}

            {currentTab === 'datasets' && (
              <DatasetManagement />
            )}

            {currentTab === 'model-performance' && modelData && (
              <ModelPerformance modelData={modelData} />
            )}

            {currentTab === 'settings' && (
              <SettingsModule
                currentFactory={selectedFactory}
                onUpdateFactory={setSelectedFactory}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
