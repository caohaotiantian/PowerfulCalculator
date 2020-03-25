function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

// 重写表达式为SymPy可以理解的形式
let parseMatrixShorthand = function (expr) {

    if (expr.indexOf(',') >= 0 && expr.indexOf('[') < 0 && expr.indexOf('(') < 0)
        return 'Matrix([' + expr + '])';

    if (expr.indexOf('[') < 0) return expr; // No matrix defined

    let start = expr.indexOf('[');
    let index = start + 1;

    let mStart = expr.indexOf('Matrix');
    if (mStart >= 0 && mStart <= start) {

        if (expr.indexOf('(', mStart) <= 0) {
            console.warn('No opening tag ( found for the matrix.');
            return expr;
        }

        if (expr.indexOf(')', mStart) <= 0) {
            console.warn('No closing tag ) found for the matrix.')
            return expr;
        }

        let mIndex = expr.indexOf('(', mStart) + 1;
        let mStack = 1;

        while (mStack && mIndex < expr.length) {
            if (expr[mIndex] == '(') mStack++;
            if (expr[mIndex] == ')') mStack--;
            mIndex++;
        }

        if (mStack > 0) {
            console.warn('No matching end tag ) found for the matrix.');
            return expr;
        }

        let close = mIndex + 1;
        return expr.substr(0, close) + parseMatrixShorthand(expr.substr(close));
    }

    if (expr.indexOf(']', index) <= 0) {
        console.warn('No closing tag ] found for the expression.');
        return expr;
    }

    let stack = 1;
    while (stack && index < expr.length) {
        if (expr[index] == '[') stack++;
        if (expr[index] == ']') stack--;
        index++;
    }

    if (stack > 0) {
        console.warn('No matching end tag ] found for the expression.');
        return expr;
    }

    let end = index;
    let subexpr = expr.substr(start, end - start);
    return expr.substr(0, start) + 'Matrix(' + subexpr + ')' + parseMatrixShorthand(expr.substr(end));
};

// 将一个列表的数字转化为矩阵
let parseSeperatedDigits = function (str) {
    if (/[\d][ \t]+[\d]/.test(str)) {
        let digits = replaceAll(str, '\t', ' ')
            .split(' ')
            .filter(s => /^[\.\d]+$/.test(s))
            .map(s => Number(s));
        return '[' + digits.join(', ') + ']';
    } else return str;
}


let parseGenerators = function (str) {
    range = /Range\( *([\d]*) *, *([\d]*) *\)/

    if (range.test(str)) {
        //str = str.replace(range_ab, 1);
    }
    return str;
}