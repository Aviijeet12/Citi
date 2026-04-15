import React from 'react'
import { Box, Card, Typography } from '@mui/material'
import {
  ComposedChart,
  BarChart,
  LineChart,
  AreaChart,
  RadarChart,
  PieChart,
  Pie,
  Bar,
  Line,
  Area,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Advanced3DChartProps {
  type: 'bar' | 'line' | 'area' | 'composed' | 'radar' | 'pie'
  data: any[]
  title?: string
  height?: number
  colors?: string[]
  glowEffect?: boolean
}

const COLORS = ['#00d9d9', '#0066ff', '#ff8a00', '#00d97e', '#ffc000', '#ff1a1a']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(30, 38, 51, 0.95), rgba(26, 31, 46, 0.85))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 217, 217, 0.3)',
          borderRadius: '8px',
          p: 1.5,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Typography
            key={index}
            variant="caption"
            sx={{
              color: entry.color,
              display: 'block',
              fontWeight: 500,
            }}
          >
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Box>
    )
  }
  return null
}

export const Advanced3DChart: React.FC<Advanced3DChartProps> = ({
  type,
  data,
  title,
  height = 400,
  colors = COLORS,
  glowEffect = true,
}) => {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <defs>
                {colors.map((color, idx) => (
                  <linearGradient
                    key={`grad-${idx}`}
                    id={`gradient-${idx}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 217, 0.1)" />
              <XAxis stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {colors.map((color, idx) => (
                <Bar
                  key={idx}
                  dataKey={`value${idx + 1}`}
                  fill={`url(#gradient-${idx})`}
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <defs>
                {colors.map((color, idx) => (
                  <linearGradient
                    key={`line-grad-${idx}`}
                    id={`line-gradient-${idx}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 217, 0.1)" />
              <XAxis stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {colors.map((color, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={`value${idx + 1}`}
                  stroke={color}
                  strokeWidth={3}
                  dot={{ fill: color, r: 5 }}
                  isAnimationActive={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                {colors.map((color, idx) => (
                  <linearGradient
                    key={`area-grad-${idx}`}
                    id={`area-gradient-${idx}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 217, 0.1)" />
              <XAxis stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {colors.map((color, idx) => (
                <Area
                  key={idx}
                  type="monotone"
                  dataKey={`value${idx + 1}`}
                  stroke={color}
                  fill={`url(#area-gradient-${idx})`}
                  isAnimationActive={true}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 217, 0.1)" />
              <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {colors.map((color, idx) => (
                <Radar
                  key={idx}
                  name={`Series ${idx + 1}`}
                  dataKey={`value${idx + 1}`}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.6}
                  isAnimationActive={true}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, rgba(30, 38, 51, 0.8), rgba(26, 31, 46, 0.6))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 217, 217, 0.15)',
        borderRadius: '16px',
        p: 3,
        boxShadow: glowEffect
          ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 217, 217, 0.1)'
          : '0 8px 24px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: glowEffect
            ? '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 217, 217, 0.2)'
            : '0 12px 32px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      {title && (
        <Typography
          variant="h6"
          sx={{
            color: '#00d9d9',
            fontWeight: 700,
            mb: 2,
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </Typography>
      )}
      {renderChart()}
    </Card>
  )
}
