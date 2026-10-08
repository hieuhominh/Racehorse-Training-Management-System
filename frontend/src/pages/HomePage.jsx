import React from 'react';
import Hero from '../components/Hero';
import RolesSection from '../components/RolesSection';
import FlowsSection from '../components/FlowsSection';
import StableSection from '../components/StableSection';
import CtaBand from '../components/CtaBand';

export default function HomePage({ onOpenAuth }) {
  return (
    <main className="page-content">
      {/* Hero Section & Vitals Telemetry */}
      <Hero onOpenAuth={onOpenAuth} />

      {/* Roles RBAC Section */}
      <RolesSection />

      {/* Core Business Flows */}
      <FlowsSection />

      {/* Stable Map & Daily Schedule */}
      <StableSection />

      {/* CTA Band */}
      <CtaBand onOpenAuth={onOpenAuth} />
    </main>
  );
}
