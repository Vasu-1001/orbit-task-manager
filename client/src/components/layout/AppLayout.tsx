import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';
import { TaskModal } from '../tasks/TaskModal';
import { TaskDetailsModal } from '../tasks/TaskDetailsModal';
import { FocusModeModal } from '../focus/FocusModeModal';
import { useTasks } from '../../context/TaskContext';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const {
    setIsCreateModalOpen,
    isCreateModalOpen,
    isEditModalOpen,
    isDetailsModalOpen,
  } = useTasks();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 'N' or 'n' -> New Task
      if (e.key === 'n' || e.key === 'N') {
        if (!isCreateModalOpen && !isEditModalOpen && !isDetailsModalOpen && !isFocusModeOpen) {
          e.preventDefault();
          setIsCreateModalOpen(true);
        }
      }

      // 'F' or 'f' -> Focus Mode
      if (e.key === 'f' || e.key === 'F') {
        if (!isCreateModalOpen && !isEditModalOpen && !isDetailsModalOpen && !isFocusModeOpen) {
          e.preventDefault();
          setIsFocusModeOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCreateModalOpen,
    isEditModalOpen,
    isDetailsModalOpen,
    isFocusModeOpen,
    setIsCreateModalOpen,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
      />

      {/* Main Container with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800">
          <Sidebar onOpenFocusMode={() => setIsFocusModeOpen(true)} />
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <Sidebar
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                onOpenFocusMode={() => {
                  setIsMobileMenuOpen(false);
                  setIsFocusModeOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Modals & Overlays */}
      <TaskModal />
      <TaskDetailsModal />
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
      />

      {/* Toast Notification Mount */}
      <ToastContainer />
    </div>
  );
};
