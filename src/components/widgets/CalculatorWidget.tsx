import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CalculatorWidgetProps {
  widgetId: string;
}

export const CalculatorWidget = ({ widgetId }: CalculatorWidgetProps) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return a / b;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleDecimal = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".");
      setNewNumber(false);
    }
  };

  const buttonClass = "h-12 text-lg font-semibold";

  return (
    <div className="flex flex-col h-full p-4 gap-3 bg-card">
      <h3 className="font-semibold text-sm text-center">🔢 Rekenmachine</h3>
      
      <div className="bg-muted rounded-lg p-4 text-right">
        <div className="text-2xl font-bold break-all">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1">
        <Button onClick={handleClear} variant="outline" className={buttonClass}>C</Button>
        <Button onClick={() => handleOperator("÷")} variant="outline" className={buttonClass}>÷</Button>
        <Button onClick={() => handleOperator("×")} variant="outline" className={buttonClass}>×</Button>
        <Button onClick={() => handleOperator("-")} variant="outline" className={buttonClass}>-</Button>

        <Button onClick={() => handleNumber("7")} variant="secondary" className={buttonClass}>7</Button>
        <Button onClick={() => handleNumber("8")} variant="secondary" className={buttonClass}>8</Button>
        <Button onClick={() => handleNumber("9")} variant="secondary" className={buttonClass}>9</Button>
        <Button onClick={() => handleOperator("+")} variant="outline" className={buttonClass}>+</Button>

        <Button onClick={() => handleNumber("4")} variant="secondary" className={buttonClass}>4</Button>
        <Button onClick={() => handleNumber("5")} variant="secondary" className={buttonClass}>5</Button>
        <Button onClick={() => handleNumber("6")} variant="secondary" className={buttonClass}>6</Button>
        <Button onClick={handleEquals} variant="default" className={`${buttonClass} row-span-2`}>=</Button>

        <Button onClick={() => handleNumber("1")} variant="secondary" className={buttonClass}>1</Button>
        <Button onClick={() => handleNumber("2")} variant="secondary" className={buttonClass}>2</Button>
        <Button onClick={() => handleNumber("3")} variant="secondary" className={buttonClass}>3</Button>

        <Button onClick={() => handleNumber("0")} variant="secondary" className={`${buttonClass} col-span-2`}>0</Button>
        <Button onClick={handleDecimal} variant="secondary" className={buttonClass}>.</Button>
      </div>
    </div>
  );
};
