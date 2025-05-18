import * as React from "react"

export interface ChartTooltipContentProps {
  label: string
  items: ChartTooltipItemProps[]
}

export interface ChartTooltipItemProps {
  name: string
  value: string | number
  color?: string
}

export interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: any[]
  children: React.ReactNode
}

export const Chart = React.forwardRef<HTMLDivElement, ChartProps>(({ className, ...props }, ref) => {
  return <div className={className} ref={ref} {...props} />
})
Chart.displayName = "Chart"

export const ChartContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={className} ref={ref} {...props} />
  },
)
ChartContainer.displayName = "ChartContainer"

export const ChartLegend = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={className} ref={ref} {...props} />
  },
)
ChartLegend.displayName = "ChartLegend"

export const ChartTooltip = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={className} ref={ref} {...props} />
  },
)
ChartTooltip.displayName = "ChartTooltip"

export function ChartTooltipContent({ label, items }: ChartTooltipContentProps) {
  return (
    <div className="rounded-md border bg-popover p-4 text-popover-foreground shadow-sm">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <ul className="grid gap-1">
        {items.map((item, i) => (
          <ChartTooltipItem key={i} {...item} />
        ))}
      </ul>
    </div>
  )
}
ChartTooltipContent.displayName = "ChartTooltipContent"

export function ChartTooltipItem({ name, value, color }: ChartTooltipItemProps) {
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="mr-2">{name}</span>
      <div className="flex items-center">
        {color && <span className="mr-2 block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
        <span>{value}</span>
      </div>
    </li>
  )
}
ChartTooltipItem.displayName = "ChartTooltipItem"
