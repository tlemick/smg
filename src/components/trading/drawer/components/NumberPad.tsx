'use client';

import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  maxValue?: number;
  disabled?: boolean;
}

/**
 * Calculator-style number pad for trade amount entry
 * 
 * Features:
 * - 3x4 grid layout (1-9, ., 0, backspace)
 * - Large touch targets (min 48px)
 * - Decimal point handling
 * - Maximum value validation
 * - Disabled state support
 */
export function NumberPad({ value, onChange, maxValue, disabled = false }: NumberPadProps) {
  const handleButtonClick = (input: string) => {
    if (disabled) return;

    let newValue = value;

    if (input === 'backspace') {
      newValue = value.slice(0, -1);
    } else if (input === '.') {
      // Only allow one decimal point
      if (!value.includes('.')) {
        newValue = value + '.';
      }
    } else {
      // Append the number
      newValue = value + input;
    }

    // Validate against max value
    const numericValue = parseFloat(newValue);
    if (maxValue && !isNaN(numericValue) && numericValue > maxValue) {
      return; // Don't update if exceeds max
    }

    onChange(newValue);
  };

  const buttonClass =
    'h-14 text-lg font-mono font-semibold transition-colors hover:bg-accent active:scale-95';

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Row 1: 1, 2, 3 */}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('1')}
        disabled={disabled}
      >
        1
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('2')}
        disabled={disabled}
      >
        2
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('3')}
        disabled={disabled}
      >
        3
      </Button>

      {/* Row 2: 4, 5, 6 */}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('4')}
        disabled={disabled}
      >
        4
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('5')}
        disabled={disabled}
      >
        5
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('6')}
        disabled={disabled}
      >
        6
      </Button>

      {/* Row 3: 7, 8, 9 */}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('7')}
        disabled={disabled}
      >
        7
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('8')}
        disabled={disabled}
      >
        8
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('9')}
        disabled={disabled}
      >
        9
      </Button>

      {/* Row 4: ., 0, backspace */}
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('.')}
        disabled={disabled}
      >
        .
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('0')}
        disabled={disabled}
      >
        0
      </Button>
      <Button
        variant="outline"
        className={buttonClass}
        onClick={() => handleButtonClick('backspace')}
        disabled={disabled}
      >
        <Delete className="h-5 w-5" />
      </Button>
    </div>
  );
}
