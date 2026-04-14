# 📊 Advanced Analytics Charts - Shadcn/UI

## Overview
Three premium analytics chart components built with **shadcn/ui** and **Recharts**, featuring a **minimalist luxury aesthetic** with monochrome palettes.

---

## 🎨 Design Philosophy

### Color Palette
- **Primary**: `hsl(var(--foreground))` / `#1C1C1E` (Dark)
- **Secondary**: `rgba(28, 28, 30, 0.4)` - `rgba(28, 28, 30, 0.8)` (Opacity variations)
- **Background**: `#FAF9F6` (Dirty White)
- **Accents**: Subtle grays and silvers
- **No bright colors** - Maintains luxury minimalist aesthetic

### UI Features
- **Glassmorphism** - `bg-white/50 backdrop-blur-sm`
- **Subtle borders** - `border-[#1C1C1E]/10`
- **Clean typography** - Uppercase tracking, varied weights
- **Smooth tooltips** - `bg-white/95 backdrop-blur-lg`
- **Responsive design** - Mobile-first approach

---

## 📈 Components

### 1. CustomerImpactRings
**File**: `components/analytics/CustomerImpactRings.tsx`

#### Description
Concentric radial bar chart showing customer sustainability impact through two metrics:
- **Inner Ring**: Money Saved (dark)
- **Outer Ring**: Waste Prevented (lighter)

#### Features
- ✅ Radial bar chart with custom styling
- ✅ Percentage-based visualization
- ✅ Interactive tooltips with actual values
- ✅ Legend cards with summary stats
- ✅ Glassmorphism card design

#### Props
```typescript
interface CustomerImpactRingsProps {
  moneySaved: number;        // Amount in PHP
  wastePrevented: number;    // Weight in kg
}
```

#### Usage
```tsx
import { CustomerImpactRings } from "@/components/analytics";

<CustomerImpactRings
  moneySaved={12450}
  wastePrevented={87.5}
/>
```

#### Visual Structure
```
┌─────────────────────────────────┐
│ CUSTOMER IMPACT                 │
│ Your contribution to...         │
├─────────────────────────────────┤
│                                 │
│        ◉◉◉◉◉◉◉                 │
│      ◉◉       ◉◉               │
│     ◉           ◉              │
│    ◉             ◉             │
│     ◉           ◉              │
│      ◉◉       ◉◉               │
│        ◉◉◉◉◉◉◉                 │
│                                 │
├─────────────────────────────────┤
│ ● Money Saved  │ ● Waste Prev.  │
│   ₱12,450      │   87.5 kg      │
└─────────────────────────────────┘
```

---

### 2. TopItemsChart
**File**: `components/analytics/TopItemsChart.tsx`

#### Description
Horizontal bar chart displaying top-selling items, optimized for mobile readability.

#### Features
- ✅ Vertical layout (horizontal bars)
- ✅ No grid lines for clean look
- ✅ Truncated names for mobile
- ✅ Rich tooltips with product details
- ✅ Summary statistics cards
- ✅ Auto-sorts by units sold

#### Props
```typescript
interface TopItem {
  name: string;
  sold: number;
  revenue: number;
}

interface TopItemsChartProps {
  items: TopItem[];
  title?: string;
  description?: string;
}
```

#### Usage
```tsx
import { TopItemsChart } from "@/components/analytics";

<TopItemsChart
  items={[
    { name: "Artisan Bread Bundle", sold: 145, revenue: 21750 },
    { name: "Premium Coffee Beans", sold: 132, revenue: 39600 },
    { name: "Gourmet Pastry Box", sold: 98, revenue: 14700 },
  ]}
  title="Top Selling Items"
  description="Best performing products this month"
/>
```

#### Visual Structure
```
┌─────────────────────────────────┐
│ TOP SELLING ITEMS               │
│ Best performing products...     │
├─────────────────────────────────┤
│ Artisan Bread    ████████ 145   │
│ Coffee Beans     ███████  132   │
│ Pastry Box       █████    98    │
│ Vegetable Pack   ████     87    │
│ Fruit Basket     ███      76    │
├─────────────────────────────────┤
│ Total Units │ Total Revenue     │
│     538     │    ₱95,550        │
└─────────────────────────────────┘
```

---

### 3. PlatformGrowthArea
**File**: `components/analytics/PlatformGrowthArea.tsx`

#### Description
Area chart with gradient fill showing platform growth metrics over time.

#### Features
- ✅ Smooth area chart with monotone curve
- ✅ Linear gradient fade-to-transparent effect
- ✅ Multiple metrics support (users/merchants/transactions)
- ✅ Growth percentage indicator
- ✅ Date formatting for X-axis
- ✅ Number abbreviation (1k, 2k, etc.)
- ✅ Comprehensive tooltip with all metrics

#### Props
```typescript
interface GrowthDataPoint {
  date: string;           // ISO date string
  users: number;
  merchants: number;
  transactions: number;
}

interface PlatformGrowthAreaProps {
  data: GrowthDataPoint[];
  title?: string;
  description?: string;
  metric?: "users" | "merchants" | "transactions";
}
```

#### Usage
```tsx
import { PlatformGrowthArea } from "@/components/analytics";

const data = [
  { date: "2024-01-01", users: 1000, merchants: 50, transactions: 200 },
  { date: "2024-01-02", users: 1050, merchants: 52, transactions: 215 },
  // ... more data points
];

<PlatformGrowthArea
  data={data}
  title="Platform Growth"
  description="User and merchant growth over time"
  metric="users"
/>
```

#### Visual Structure
```
┌─────────────────────────────────┐
│ PLATFORM GROWTH    │ Growth     │
│ User and merchant...│ +15.3%    │
├─────────────────────────────────┤
│                    ╱╲           │
│                  ╱    ╲         │
│                ╱        ╲       │
│              ╱            ╲     │
│            ╱                ╲   │
│          ╱                    ╲ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
├─────────────────────────────────┤
│ Users │ Merchants │ Orders      │
│ 2,450 │    155    │   3,215     │
└─────────────────────────────────┘
```

---

## 🎯 Key Features

### Glassmorphism Design
All charts use glassmorphism for a modern, premium feel:
```tsx
className="border-[#1C1C1E]/10 bg-white/50 backdrop-blur-sm"
```

### Custom Tooltips
Rich, informative tooltips with:
- Glassmorphism background
- Multiple data points
- Formatted values
- Clean typography

```tsx
<ChartTooltip
  content={
    <ChartTooltipContent
      className="bg-white/95 backdrop-blur-lg border-[#1C1C1E]/10"
      formatter={(value, name, item) => {
        // Custom formatting logic
      }}
    />
  }
/>
```

### Responsive Layout
- Mobile-first design
- Horizontal bars for mobile readability
- Truncated text for small screens
- Flexible grid layouts

### Monochrome Palette
Consistent use of:
- `hsl(var(--foreground))` for primary elements
- `#1C1C1E` with opacity variations
- `#FAF9F6` for backgrounds
- No bright colors

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Horizontal bars for readability
- Truncated labels
- Touch-friendly tooltips

### Tablet (768px - 1024px)
- 2-column grid
- Balanced chart sizes
- Readable labels

### Desktop (> 1024px)
- 3-column grid
- Full-width area charts
- Maximum data visibility

---

## 🔧 Technical Details

### Dependencies
```json
{
  "recharts": "^2.x",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.x"
}
```

### Shadcn Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`

### Chart Types
- **RadialBarChart** - Concentric rings
- **BarChart** - Horizontal bars
- **AreaChart** - Gradient area

---

## 🎨 Customization

### Colors
Modify in each component:
```tsx
const chartConfig = {
  metric: {
    label: "Label",
    color: "hsl(var(--foreground))", // Change here
  },
};
```

### Gradients
Customize in `PlatformGrowthArea`:
```tsx
<linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
</linearGradient>
```

### Dimensions
Adjust in `ChartContainer`:
```tsx
<ChartContainer className="h-[250px] w-full">
  {/* Chart content */}
</ChartContainer>
```

---

## 📊 Data Requirements

### CustomerImpactRings
- `moneySaved`: Positive number (PHP)
- `wastePrevented`: Positive number (kg)

### TopItemsChart
- `items`: Array of objects with `name`, `sold`, `revenue`
- Automatically sorts and takes top 5
- Handles long names with truncation

### PlatformGrowthArea
- `data`: Array of objects with `date`, `users`, `merchants`, `transactions`
- `date`: ISO date string (YYYY-MM-DD)
- Numbers: Positive integers
- Minimum 2 data points recommended

---

## 🚀 Integration Examples

### Customer Dashboard
```tsx
import { CustomerImpactRings } from "@/components/analytics";

export default function CustomerDashboard({ userId }) {
  const impact = await getCustomerImpact(userId);
  
  return (
    <div className="p-6">
      <CustomerImpactRings
        moneySaved={impact.totalSaved}
        wastePrevented={impact.wasteKg}
      />
    </div>
  );
}
```

### Merchant Dashboard
```tsx
import { TopItemsChart } from "@/components/analytics";

export default function MerchantDashboard({ storeId }) {
  const items = await getTopSellingItems(storeId);
  
  return (
    <div className="p-6">
      <TopItemsChart items={items} />
    </div>
  );
}
```

### Admin Dashboard
```tsx
import { PlatformGrowthArea } from "@/components/analytics";

export default function AdminDashboard() {
  const growthData = await getPlatformGrowth();
  
  return (
    <div className="p-6 space-y-6">
      <PlatformGrowthArea
        data={growthData}
        metric="users"
      />
      <PlatformGrowthArea
        data={growthData}
        metric="merchants"
      />
    </div>
  );
}
```

---

## 🎯 Best Practices

### Data Fetching
- Fetch data server-side when possible
- Use React Query for client-side caching
- Implement loading states

### Performance
- Memoize data transformations
- Limit data points (30-60 for area charts)
- Use pagination for large datasets

### Accessibility
- Tooltips provide detailed information
- Color is not the only indicator
- Keyboard navigation supported

### Error Handling
- Validate data before rendering
- Provide fallback UI for empty data
- Handle edge cases (0 values, negative numbers)

---

## 📝 Demo Component

A complete demo is available in:
```
components/analytics/AnalyticsDashboardDemo.tsx
```

This shows all three charts with sample data and usage instructions.

---

## ✅ Checklist

- [x] Shadcn/ui chart components installed
- [x] Recharts dependency added
- [x] Card component installed
- [x] Monochrome color palette implemented
- [x] Glassmorphism design applied
- [x] Mobile-responsive layouts
- [x] Custom tooltips with rich data
- [x] TypeScript types defined
- [x] No compilation errors
- [x] Documentation complete

---

## 🔮 Future Enhancements

Potential improvements:
- [ ] Export to PNG/PDF functionality
- [ ] Real-time data updates
- [ ] Comparison mode (YoY, MoM)
- [ ] Custom date range selector
- [ ] Animation on data change
- [ ] Dark mode support
- [ ] More chart types (pie, line, scatter)
- [ ] Data table view toggle

---

## 📚 Resources

- [Shadcn/ui Charts](https://ui.shadcn.com/docs/components/chart)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🎉 Summary

Three premium analytics charts ready for production:

✅ **CustomerImpactRings** - Radial bars for sustainability metrics  
✅ **TopItemsChart** - Horizontal bars for top products  
✅ **PlatformGrowthArea** - Area chart with gradient for growth  

All featuring:
- Minimalist luxury aesthetic
- Monochrome color palette
- Glassmorphism design
- Mobile-responsive
- Rich tooltips
- TypeScript support
