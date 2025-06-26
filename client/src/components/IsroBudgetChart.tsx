import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors // Import Colors plugin
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors // Register Colors plugin
);

const IsroBudgetChart: React.FC = () => {
  // Data manually curated from Wikipedia text previously viewed
  // (Section 13.1 Budget for the Department of Space, Nominal INR (crore))
  const budgetHistory = [
    { year: "2014-15", budgetCrore: 5821.37 },
    { year: "2015-16", budgetCrore: 6920.01 },
    { year: "2016-17", budgetCrore: 8039.99 },
    { year: "2017-18", budgetCrore: 9130.57 },
    { year: "2018-19", budgetCrore: 11192.66 },
    { year: "2019-20", budgetCrore: 13033.29 },
    { year: "2020-21", budgetCrore: 9490.05 }, // Dip
    { year: "2021-22", budgetCrore: 12473.84 },
    // Note: Wikipedia table had data up to 2021-22.
    // A figure for 2025-26 (₹13,416.2 crore) was in the ISRO infobox,
    // but for a consistent time-series bar chart, using continuous years is better.
  ];

  const data = {
    labels: budgetHistory.map(item => item.year),
    datasets: [
      {
        label: 'ISRO Budget (₹ Crore)',
        data: budgetHistory.map(item => item.budgetCrore),
        // Chart.js will pick colors automatically if the Colors plugin is registered
        // Alternatively, specify backgroundColor and borderColor:
        // backgroundColor: 'rgba(54, 162, 235, 0.6)', // Example blue
        // borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Important for sizing within a div
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'ISRO Annual Budget Allocation (Nominal)',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(context.parsed.y) + ' Cr';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Budget (₹ Crore)'
        },
        beginAtZero: true,
      },
      x: {
        title: {
          display: true,
          text: 'Fiscal Year'
        }
      }
    },
  };

  return (
    // Ensure the parent div has a defined height for the chart to render correctly
    <div style={{ height: '400px', width: '100%' }}>
      <Bar options={options} data={data} />
      <p className="text-xs text-gray-500 mt-2 text-center">
        Data manually curated from Wikipedia (ISRO article, Budget section) for demonstration. For official figures, please refer to Department of Space budget documents.
      </p>
    </div>
  );
};

export default IsroBudgetChart;
