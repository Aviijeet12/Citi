import React from 'react'
import { Box, Card, Typography } from '@mui/material'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

interface PerformanceChartProps {
  data: any[]
  type: 'line' | 'bar' | 'pie' | 'radar'
  dataKey: string
  title: string
  height?: number
  colors?: string[]
}

const defaultColors = ['#00D9D9', '#0066FF', '#FF8A00', '#00D97E', '#FF6B6B', '#FFA726']

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  type,
  dataKey,
  title,
  height = 300,
  colors = defaultColors,
}) => {
  return (
    <Card
      sx={{
        p: 2.5,
        backgroundColor: '#1E2633',
        border: '1px solid #3A4556',
        borderRadius: '12px',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: '#FFFFFF',
          mb: 2,
          fontWeight: 700,
          fontSize: '1rem',
        }}
      >
        {title}
      </Typography>

      <ResponsiveContainer width="100%" height={height}>
        {type === 'line' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3A4556" />
            <XAxis stroke="#7A8699" />
            <YAxis stroke="#7A8699" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2A3142',
                border: '1px solid #3A4556',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#FFFFFF' }}
            />
            <Legend wrapperStyle={{ color: '#7A8699' }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              dot={{ fill: colors[0], r: 4 }}
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          </LineChart>
        )}

        {type === 'bar' && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3A4556" />
            <XAxis stroke="#7A8699" />
            <YAxis stroke="#7A8699" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2A3142',
                border: '1px solid #3A4556',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#FFFFFF' }}
            />
            <Legend wrapperStyle={{ color: '#7A8699' }} />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        )}

        {type === 'pie' && (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill={colors[0]}
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#2A3142',
                border: '1px solid #3A4556',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#FFFFFF' }}
            />
          </PieChart>
        )}

        {type === 'radar' && (
          <RadarChart data={data}>
            <PolarGrid stroke="#3A4556" />
            <PolarAngleAxis dataKey="subject" stroke="#7A8699" />
            <PolarRadiusAxis stroke="#7A8699" />
            <Radar
              name={dataKey}
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2A3142',
                border: '1px solid #3A4556',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#FFFFFF' }}
            />
          </RadarChart>
        )}
      </ResponsiveContainer>
    </Card>
  )
}

export default PerformanceChart
