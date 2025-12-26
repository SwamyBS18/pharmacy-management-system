import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PredictionsContent from "./PredictionsContent";

export default function PredictionsDashboard() {
    return (
        <DashboardLayout role="admin">
           <PredictionsContent />
        </DashboardLayout>
    );
}
