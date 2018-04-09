declare module 'logic-solver' {

    // Public Type Testers
    export function isNumTerm(x: any): x is NumTerm;
    export function isNameTerm(x: any): x is NameTerm;
    export function isTerm(x: any): x is Term;
    export function isWholeNumber(x: any): x is WholeNumber;
    export function isFormula(x: any): x is Formula;
    export function isClause(x: any): x is Clause;
    export function isBits(x: any): x is Bits;

    export function disablingAssertions(f: () => void): void;

    export type WholeNumber = number;
    export type NumTerm = number;   // 32-bit integer but not 0
    export type NameTerm = string;  // NameTerm must not be empty, or just `-` characters, or look like a number
    export type Term = NameTerm | NumTerm;
    export type FormulaOrTerm = Formula | Term;
    export type Terms = Term | Term[];
    export type FormulaOrTerms = Formula | Terms;

    export function not(operand: Formula): Formula;
    export function not(operand: NumTerm): NumTerm;
    export function not(operand: NameTerm): NameTerm;

    export const NAME_FALSE = "$F";
    export const NAME_TRUE = "$T";
    export const NUM_FALSE = 1;
    export const NUM_TRUE = 2;

    export const TRUE = "$T";
    export const FALSE = "$F";

    export abstract class Formula {
        guid(): number;
    }

    export class Clause {
        constructor(...x: FormulaOrTerm[]);
        append(...x: FormulaOrTerm[]): void;
    }

    export class Termifier {
        constructor(solver: any);
        clause(...args: FormulaOrTerms[]): Clause;
        term(formula: Formula): NumTerm;
        generate(isTrue: boolean, formula: FormulaOrTerm): Clause[];
    }

    export class Solver {
        constructor();
        getVarNum(vname: any, noCreate: boolean, _createInternals: boolean): number;
        getVarName(vnum: number): string;

        toNumTerm(t: Term): NumTerm;
        toNameTerm(t: Term): NameTerm;

        require(args: FormulaOrTerms): void;
        forbid(...args: FormulaOrTerms[]): void;

        solve(assumedVariables?: FormulaOrTerm): null | Solution;
        solveAssuming(formula: FormulaOrTerm): null | Solution;

        minimizeWeightedSum(solution: Solution, costTerms: FormulaOrTerm[], costWeights: number[] | WholeNumber, options?: OptimizeOptions): null | Solution;
        maximizeWeightedSum(solution: Solution, costTerms: FormulaOrTerm[], costWeights: number[] | WholeNumber, options?: OptimizeOptions): null | Solution;
    }
    export interface OptimizeOptions {
        formula?: Bits
        progress?: (state: 'improving' | 'finished' | 'trying', cost: number) => void;
        strategy?: 'default' | 'bottom-up';
    }

    export class Assumption {
        constructor(formula: FormulaOrTerm);
    }

    export class Solution {
        constructor(solver: Solver, assignment: boolean[] /* ??? */);
        ignoreUnknownVariables(): void;
        getMap(): Map<string, boolean>;
        getTrueVars(): string[];
        getFormula(): Formula;

        evaluate(formula: FormulaOrTerm): boolean;
        evaluate(bits: Bits): number;

        getWeightedSum(formulas: (FormulaOrTerm | Bits)[], weights: number | number[]): number;
    }

    export function or(...args: FormulaOrTerms[]): OrFormula;
    export class OrFormula extends Formula {
        constructor(operands: FormulaOrTerm[]);
    }

    export class NotFormula extends Formula {
        constructor(operand: FormulaOrTerm);
    }

    export function and(...args: FormulaOrTerm[]): "$T" | FormulaOrTerm;
    export class AndFormula extends Formula {
        constructor(operands: FormulaOrTerm[]);
    }

    export function xor(...args: FormulaOrTerm[]): "$F" | FormulaOrTerm;
    export class XorFormula extends Formula {
        constructor(operands: FormulaOrTerm[]);
    }

    export function atMostOne(...args: FormulaOrTerm[]): "$T" | AtMostOneFormula;
    export class AtMostOneFormula extends Formula {
        constructor(operands: FormulaOrTerm[]);
    }

    export function implies(a: FormulaOrTerm, b: FormulaOrTerm): ImpliesFormula;
    export class ImpliesFormula extends Formula {
        constructor(a: FormulaOrTerm, b: FormulaOrTerm);
    }

    export function equiv(a: FormulaOrTerm, b: FormulaOrTerm): ImpliesFormula;
    export class EquivFormula extends Formula {
        constructor(a: FormulaOrTerm, b: FormulaOrTerm);
    }

    export function exactlyOne(...args: FormulaOrTerm[]): "$F" | FormulaOrTerm;
    export class ExactlyOneFormula extends Formula {
        constructor(operands: FormulaOrTerm[]);
    }

    export class Bits {
        constructor(formulaArray: FormulaOrTerm[]);
    }
    export function constantBits(wholeNumber: WholeNumber): Bits;
    export function variableBits(baseName: string, nbits: WholeNumber): Bits;

    export function lessThanOrEqual(bits1: Bits, bits2: Bits): LessThanOrEqualFormula;
    export class LessThanOrEqualFormula extends Formula {
        constructor(bits1: Bits, bits2: Bits);
    }

    export function lessThan(bits1: Bits, bits2: Bits): LessThanFormula;
    export class LessThanFormula extends Formula {
        constructor(bits1: Bits, bits2: Bits);
    }

    export function greaterThan(bits1: Bits, bits2: Bits): LessThanFormula;
    export function greaterThanOrEqual(bits1: Bits, bits2: Bits): LessThanOrEqualFormula;

    export function equalBits(bits1: Bits, bits2: Bits): EqualBitsFormula;
    export class EqualBitsFormula extends Formula {
        constructor(bits1: Bits, bits2: Bits);
    }

    export class HalfAdderSum {
        constructor(formula1: FormulaOrTerm, formula2: FormulaOrTerm);
    }
    export class HalfAdderCarry {
        constructor(formula1: FormulaOrTerm, formula2: FormulaOrTerm);
    }
    export class FullAdderSum {
        constructor(formula1: FormulaOrTerm, formula2: FormulaOrTerm, formula3: FormulaOrTerm);
    }
    export class FullAdderCarry {
        constructor(formula1: FormulaOrTerm, formula2: FormulaOrTerm, formula3: FormulaOrTerm);
    }

    // Algorithms

    export function weightedSum(formulas: Formula[], weights: number | number[]): Bits;
    export function sum(...args: (FormulaOrTerms | Bits[])[]): Bits;

}
