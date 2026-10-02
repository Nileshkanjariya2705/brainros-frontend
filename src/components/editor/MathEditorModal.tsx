import React, { useState, useEffect, useMemo, useRef } from 'react';
import katex from 'katex';
import { X, Sparkles, Check } from 'lucide-react';

interface MathEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string, type: 'inline' | 'block') => void;
  initialLatex?: string;
  initialType?: 'inline' | 'block';
}

interface MathSymbol {
  label: string;
  latex: string;
  preview?: string;
  category: string;
}

const MATH_CATEGORIES = [
  { id: 'basic', label: 'Basic & Algebra' },
  { id: 'greek', label: 'Greek Letters' },
  { id: 'operators', label: 'Operators & Relations' },
  { id: 'calculus', label: 'Calculus & Series' },
  { id: 'physics_chem', label: 'Physics & Chemistry' },
];

const MATH_SYMBOLS: MathSymbol[] = [
  // Basic & Algebra
  { category: 'basic', label: 'Fraction', latex: '\\frac{a}{b}' },
  { category: 'basic', label: 'Square Root', latex: '\\sqrt{x}' },
  { category: 'basic', label: 'N-th Root', latex: '\\sqrt[n]{x}' },
  { category: 'basic', label: 'Superscript / Power', latex: 'x^{2}' },
  { category: 'basic', label: 'Subscript', latex: 'x_{1}' },
  { category: 'basic', label: 'Sub & Super', latex: 'x_{i}^{2}' },
  { category: 'basic', label: 'Parentheses ( )', latex: '\\left( x \\right)' },
  { category: 'basic', label: 'Brackets [ ]', latex: '\\left[ x \\right]' },
  { category: 'basic', label: 'Braces { }', latex: '\\left\\{ x \\right\\}' },
  { category: 'basic', label: 'Absolute Value | |', latex: '\\left| x \\right|' },
  { category: 'basic', label: 'Plus-Minus', latex: '\\pm' },
  { category: 'basic', label: 'Multiplication', latex: '\\times' },
  { category: 'basic', label: 'Division', latex: '\\div' },
  { category: 'basic', label: 'Dot Product', latex: '\\cdot' },
  { category: 'basic', label: 'Percent', latex: '\\%' },
  { category: 'basic', label: 'Degree', latex: '^{\\circ}' },

  // Greek Letters - Lowercase
  { category: 'greek', label: 'alpha', latex: '\\alpha' },
  { category: 'greek', label: 'beta', latex: '\\beta' },
  { category: 'greek', label: 'gamma', latex: '\\gamma' },
  { category: 'greek', label: 'delta', latex: '\\delta' },
  { category: 'greek', label: 'epsilon', latex: '\\epsilon' },
  { category: 'greek', label: 'theta', latex: '\\theta' },
  { category: 'greek', label: 'lambda', latex: '\\lambda' },
  { category: 'greek', label: 'mu', latex: '\\mu' },
  { category: 'greek', label: 'nu', latex: '\\nu' },
  { category: 'greek', label: 'pi', latex: '\\pi' },
  { category: 'greek', label: 'rho', latex: '\\rho' },
  { category: 'greek', label: 'sigma', latex: '\\sigma' },
  { category: 'greek', label: 'tau', latex: '\\tau' },
  { category: 'greek', label: 'phi', latex: '\\phi' },
  { category: 'greek', label: 'psi', latex: '\\psi' },
  { category: 'greek', label: 'omega', latex: '\\omega' },
  // Greek Letters - Uppercase
  { category: 'greek', label: 'Gamma', latex: '\\Gamma' },
  { category: 'greek', label: 'Delta', latex: '\\Delta' },
  { category: 'greek', label: 'Theta', latex: '\\Theta' },
  { category: 'greek', label: 'Lambda', latex: '\\Lambda' },
  { category: 'greek', label: 'Pi', latex: '\\Pi' },
  { category: 'greek', label: 'Sigma', latex: '\\Sigma' },
  { category: 'greek', label: 'Phi', latex: '\\Phi' },
  { category: 'greek', label: 'Psi', latex: '\\Psi' },
  { category: 'greek', label: 'Omega', latex: '\\Omega' },

  // Operators & Relations
  { category: 'operators', label: 'Equals', latex: '=' },
  { category: 'operators', label: 'Not Equal', latex: '\\neq' },
  { category: 'operators', label: 'Approx Equal', latex: '\\approx' },
  { category: 'operators', label: 'Identical To', latex: '\\equiv' },
  { category: 'operators', label: 'Less Than', latex: '<' },
  { category: 'operators', label: 'Greater Than', latex: '>' },
  { category: 'operators', label: 'Less or Equal', latex: '\\le' },
  { category: 'operators', label: 'Greater or Equal', latex: '\\ge' },
  { category: 'operators', label: 'Much Less', latex: '\\ll' },
  { category: 'operators', label: 'Much Greater', latex: '\\gg' },
  { category: 'operators', label: 'Proportional To', latex: '\\propto' },
  { category: 'operators', label: 'Infinity', latex: '\\infty' },
  { category: 'operators', label: 'Element Of', latex: '\\in' },
  { category: 'operators', label: 'Not In', latex: '\\notin' },
  { category: 'operators', label: 'Subset', latex: '\\subset' },
  { category: 'operators', label: 'Right Arrow', latex: '\\rightarrow' },
  { category: 'operators', label: 'Implies', latex: '\\Rightarrow' },
  { category: 'operators', label: 'If and only if', latex: '\\iff' },

  // Calculus & Series
  { category: 'calculus', label: 'Definite Integral', latex: '\\int_{a}^{b} f(x) \\, dx' },
  { category: 'calculus', label: 'Indefinite Integral', latex: '\\int f(x) \\, dx' },
  { category: 'calculus', label: 'Double Integral', latex: '\\iint_{S} f(x,y) \\, dA' },
  { category: 'calculus', label: 'Summation', latex: '\\sum_{i=1}^{n} x_i' },
  { category: 'calculus', label: 'Product', latex: '\\prod_{i=1}^{n} x_i' },
  { category: 'calculus', label: 'Derivative', latex: '\\frac{df}{dx}' },
  { category: 'calculus', label: 'Partial Derivative', latex: '\\frac{\\partial f}{\\partial x}' },
  { category: 'calculus', label: 'Limit', latex: '\\lim_{x \\to 0}' },
  { category: 'calculus', label: 'Vector Gradient (Del)', latex: '\\nabla' },

  // Physics & Chemistry
  { category: 'physics_chem', label: 'Vector arrow', latex: '\\vec{v}' },
  { category: 'physics_chem', label: 'Unit vector i', latex: '\\hat{i}' },
  { category: 'physics_chem', label: 'Unit vector j', latex: '\\hat{j}' },
  { category: 'physics_chem', label: 'Unit vector k', latex: '\\hat{k}' },
  { category: 'physics_chem', label: 'Average (Overline)', latex: '\\bar{x}' },
  { category: 'physics_chem', label: 'Delta / Change', latex: '\\Delta T' },
  { category: 'physics_chem', label: 'Degree Celsius', latex: '^{\\circ}\\text{C}' },
  { category: 'physics_chem', label: 'Equilibrium Arrow', latex: '\\rightleftharpoons' },
  { category: 'physics_chem', label: 'Reaction Arrow', latex: '\\xrightarrow{catalyst}' },
  { category: 'physics_chem', label: 'Chemical Formula', latex: '\\text{H}_2\\text{SO}_4' },
];

export const MathEditorModal: React.FC<MathEditorModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialLatex = '',
  initialType = 'inline',
}) => {
  const [latex, setLatex] = useState(initialLatex);
  const [mathType, setMathType] = useState<'inline' | 'block'>(initialType);
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLatex(initialLatex);
      setMathType(initialType);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialLatex, initialType]);

  const renderedHtml = useMemo(() => {
    if (!latex.trim()) return null;
    try {
      return {
        html: katex.renderToString(latex, {
          throwOnError: false,
          displayMode: mathType === 'block',
        }),
        error: null,
      };
    } catch (err: any) {
      return {
        html: null,
        error: err.message || 'Invalid LaTeX syntax',
      };
    }
  }, [latex, mathType]);

  if (!isOpen) return null;

  const insertSymbol = (symLatex: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLatex((prev) => (prev ? `${prev} ${symLatex}` : symLatex));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = latex;
    const newVal = currentVal.substring(0, start) + symLatex + currentVal.substring(end);
    setLatex(newVal);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + symLatex.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSave = () => {
    if (!latex.trim()) return;
    onInsert(latex.trim(), mathType);
    onClose();
  };

  const filteredSymbols = MATH_SYMBOLS.filter((s) => s.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
              ∑
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Mathematical Equation Editor</h3>
              <p className="text-xs text-slate-500">Insert formulas, fractions, roots, and scientific symbols</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Format Selection */}
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 ml-2">Equation Style:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setMathType('inline')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mathType === 'inline'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Inline Formula (within text)
              </button>
              <button
                type="button"
                onClick={() => setMathType('block')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mathType === 'block'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Display / Block (centered)
              </button>
            </div>
          </div>

          {/* Quick Symbol Palette Categories */}
          <div>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-100 scrollbar-none">
              {MATH_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Symbol Buttons Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
              {filteredSymbols.map((sym, idx) => {
                let symHtml = '';
                try {
                  symHtml = katex.renderToString(sym.latex, { throwOnError: false });
                } catch {
                  symHtml = sym.latex;
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertSymbol(sym.latex)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-white hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 text-slate-800 hover:text-indigo-600 transition-all shadow-2xs group"
                    title={`${sym.label} (${sym.latex})`}
                  >
                    <span
                      className="text-sm overflow-hidden text-ellipsis max-w-full"
                      dangerouslySetInnerHTML={{ __html: symHtml }}
                    />
                    <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 mt-1 truncate max-w-full">
                      {sym.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LaTeX Input Code Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                LaTeX Formula Expression
              </label>
              <span className="text-[11px] text-slate-400">
                You can click symbols above or type LaTeX directly
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} or \sqrt{2gR}"
              rows={3}
              className="w-full font-mono text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Live KaTeX Preview
              </span>
              <span className="text-[11px] text-slate-400">Renders identically in student exam</span>
            </div>
            <div className="min-h-[70px] flex items-center justify-center p-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-300 text-slate-900 overflow-x-auto">
              {renderedHtml?.html ? (
                <div
                  className={`max-w-full ${mathType === 'block' ? 'text-center my-1' : 'inline-block'}`}
                  dangerouslySetInnerHTML={{ __html: renderedHtml.html }}
                />
              ) : renderedHtml?.error ? (
                <span className="text-xs text-rose-500 font-mono">{renderedHtml.error}</span>
              ) : (
                <span className="text-xs text-slate-400 italic">Preview will appear here as you type or click symbols...</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setLatex('')}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            Clear Formula
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!latex.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Insert Equation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
