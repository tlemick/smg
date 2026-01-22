'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

interface ColorToken {
  name: string;
  cssVar: string;
  description: string;
}

const semanticColors: ColorToken[] = [
  { name: 'Background', cssVar: '--background', description: 'Main background color' },
  { name: 'Foreground', cssVar: '--foreground', description: 'Main text color' },
  { name: 'Card', cssVar: '--card', description: 'Card background' },
  { name: 'Card Foreground', cssVar: '--card-foreground', description: 'Card text color' },
  { name: 'Popover', cssVar: '--popover', description: 'Popover background' },
  { name: 'Popover Foreground', cssVar: '--popover-foreground', description: 'Popover text' },
  { name: 'Primary', cssVar: '--primary', description: 'Primary brand color (Violet)' },
  { name: 'Primary Foreground', cssVar: '--primary-foreground', description: 'Text on primary' },
  { name: 'Secondary', cssVar: '--secondary', description: 'Secondary background' },
  { name: 'Secondary Foreground', cssVar: '--secondary-foreground', description: 'Secondary text' },
  { name: 'Muted', cssVar: '--muted', description: 'Muted background' },
  { name: 'Muted Foreground', cssVar: '--muted-foreground', description: 'Muted text' },
  { name: 'Accent', cssVar: '--accent', description: 'Accent background' },
  { name: 'Accent Foreground', cssVar: '--accent-foreground', description: 'Accent text' },
  { name: 'Destructive', cssVar: '--destructive', description: 'Destructive/error color' },
  { name: 'Destructive Foreground', cssVar: '--destructive-foreground', description: 'Text on destructive' },
  { name: 'Neutral', cssVar: '--neutral', description: 'Neutral background' },
  { name: 'Neutral Foreground', cssVar: '--neutral-foreground', description: 'Neutral text' },
  { name: 'Border', cssVar: '--border', description: 'Border color' },
  { name: 'Input', cssVar: '--input', description: 'Input border color' },
  { name: 'Ring', cssVar: '--ring', description: 'Focus ring color' },
];

const chartColors: ColorToken[] = [
  { name: 'Chart 1', cssVar: '--chart-1', description: 'Violet' },
  { name: 'Chart 2', cssVar: '--chart-2', description: 'Blue' },
  { name: 'Chart 3', cssVar: '--chart-3', description: 'Emerald' },
  { name: 'Chart 4', cssVar: '--chart-4', description: 'Amber' },
  { name: 'Chart 5', cssVar: '--chart-5', description: 'Red' },
  { name: 'Chart 6', cssVar: '--chart-6', description: 'Near-black/white' },
  { name: 'Chart Positive', cssVar: '--chart-positive', description: 'Positive change (Emerald)' },
  { name: 'Chart Negative', cssVar: '--chart-negative', description: 'Negative change (Red)' },
];

function ColorSwatch({ color, mode }: { color: ColorToken; mode: 'light' | 'dark' }) {
  const getHslValue = (cssVar: string): string => {
    if (typeof window === 'undefined') return 'N/A';
    
    const root = mode === 'dark' 
      ? document.documentElement.classList.contains('dark') 
        ? document.documentElement 
        : null
      : document.documentElement;
    
    if (!root) return 'N/A';
    
    const value = getComputedStyle(root).getPropertyValue(cssVar).trim();
    return value || 'N/A';
  };

  const hslValue = getHslValue(color.cssVar);

  return (
    <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
      {/* Color preview */}
      <div 
        className="w-16 h-16 rounded-md border-2 border-border shadow-sm flex-shrink-0"
        style={{ backgroundColor: `hsl(${hslValue})` }}
      />
      
      {/* Color info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground">{color.name}</div>
        <div className="text-xs text-muted-foreground font-mono mt-1">{color.cssVar}</div>
        <div className="text-xs text-muted-foreground mt-1">{color.description}</div>
        <div className="text-xs text-muted-foreground font-mono mt-2 bg-muted px-2 py-1 rounded inline-block">
          hsl({hslValue})
        </div>
      </div>
    </div>
  );
}

export default function ColorsDevPage() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Color Reference Guide</h1>
            <p className="text-muted-foreground mt-2">
              All semantic color tokens defined in globals.css
            </p>
          </div>
          
          <Button onClick={toggleTheme} variant="outline" size="lg">
            {isDark ? (
              <>
                <Sun className="mr-2 h-5 w-5" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="mr-2 h-5 w-5" />
                Dark Mode
              </>
            )}
          </Button>
        </div>

        {/* Current Mode Indicator */}
        <Card>
          <CardHeader>
            <CardTitle>Current Mode: {isDark ? 'Dark' : 'Light'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Toggle the theme to see how colors change between light and dark modes.
              All values are live from computed CSS variables.
            </p>
          </CardContent>
        </Card>

        {/* Semantic Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Semantic Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {semanticColors.map((color) => (
                <ColorSwatch key={color.cssVar} color={color} mode={isDark ? 'dark' : 'light'} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chartColors.map((color) => (
                <ColorSwatch key={color.cssVar} color={color} mode={isDark ? 'dark' : 'light'} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Background variations */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Background Variations</h3>
              <div className="flex gap-4 flex-wrap">
                <div className="bg-background border border-border p-4 rounded-md">
                  <span className="text-xs font-mono">bg-background</span>
                </div>
                <div className="bg-card border border-border p-4 rounded-md">
                  <span className="text-xs font-mono">bg-card</span>
                </div>
                <div className="bg-muted border border-border p-4 rounded-md">
                  <span className="text-xs font-mono">bg-muted</span>
                </div>
                <div className="bg-secondary border border-border p-4 rounded-md">
                  <span className="text-xs font-mono">bg-secondary</span>
                </div>
              </div>
            </div>

            {/* Button variations */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Button Variations</h3>
              <div className="flex gap-4 flex-wrap">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            {/* Text variations */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Text Variations</h3>
              <div className="space-y-2">
                <p className="text-foreground">text-foreground (main text)</p>
                <p className="text-muted-foreground">text-muted-foreground (secondary text)</p>
                <p className="text-primary">text-primary (brand accent)</p>
                <p className="text-destructive">text-destructive (errors)</p>
              </div>
            </div>

            {/* Chart color demonstration */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Chart Colors</h3>
              <div className="flex gap-2">
                {chartColors.slice(0, 6).map((color, idx) => (
                  <div
                    key={color.cssVar}
                    className="w-12 h-12 rounded-md border border-border"
                    style={{ backgroundColor: `hsl(var(${color.cssVar}))` }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Code Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="text-xs text-muted-foreground mb-2">Tailwind Classes:</p>
              <code className="text-sm font-mono text-foreground">
                bg-background text-foreground border-border
              </code>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-xs text-muted-foreground mb-2">CSS Variables:</p>
              <code className="text-sm font-mono text-foreground">
                color: hsl(var(--primary));<br />
                background: hsl(var(--background));
              </code>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-xs text-muted-foreground mb-2">Chart Colors (Recharts):</p>
              <code className="text-sm font-mono text-foreground">
                fill="hsl(var(--chart-1))"<br />
                stroke="hsl(var(--chart-positive))"
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
