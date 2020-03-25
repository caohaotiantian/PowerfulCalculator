var http = new HTTP();
var app = new Vue({
    el: '#app',
    data: {
        expression: "",
        expression_parsed: "",
        expression_latex: "",
        expression_error: false,
        is_algebraic: false,
        is_equality: false,
        is_inequality: false,
        is_matrix: false,
        is_square_matrix: false,
        is_ugly: false,
        is_graph: false,
        is_directed: false,
        is_weighted: false,
        dimension: [0, 0],
        variables: [],
        parsed: false,
        plot_show: false,
        plot_base64: "",
        plot_error: "",
        plot_xlim: [-5, 5],
        plot_ylim: [-5, 5],
        action_show: false,
        action_in: "",
        action_out: "",
        action_error: "",
        action_link: "",
        action_image: "",
        action_out_list: [],
        parameter_show: false,
        parameter_func: function () {
        },
        parameter_func_name: "方程",
        parameter_a_name: "参量 1",
        parameter_a_value: "",
        parameter_b_name: "参量 2",
        parameter_b_value: "",
        parameter_c_name: "参量 3",
        parameter_c_value: "",
        parameter_explain: ""
    },
    methods: {
        expr: function () {
            let castedExpression = replaceAll(this.expression.trim(), '[\\^]', '**');
            castedExpression = replaceAll(castedExpression, 'abs', 'Abs');
            if (castedExpression.indexOf('=') >= 0) {
                let parts = castedExpression.split('=');
                castedExpression = 'Eq(' + parts[0] + ', ' + parts[1] + ')';
            }
            castedExpression = parseSeperatedDigits(castedExpression);
            if (castedExpression.indexOf('Eq') < 0)
                this.expression = castedExpression;
            castedExpression = parseMatrixShorthand(castedExpression);
            return castedExpression;
        },
        parse: function () {
            document.getElementById("function").blur();
            this.reset();
            this.setUrl();
            if (!this.expression) return;
            this.parsed = true;
            http.post('/expression', {'expression': this.expr()},
                (result) => {
                    app.expression_parse = result.expression;
                    app.expression_latex = replaceAll(result.expression_latex, 'frac', 'dfrac');
                    app.is_constant = result.is_constant;
                    app.is_equality = result.is_equality;
                    app.is_inequality = result.is_inequality;
                    app.is_matrix = result.is_matrix;
                    app.is_square_matrix = app.is_matrix ? result.dimension[0] == result.dimension[1] : false;
                    app.is_graph = app.is_square_matrix;
                    app.is_algebraic = !(app.is_constant || app.is_equality || app.is_inequality || app.is_matrix);
                    app.is_ugly = result.is_ugly;
                    app.dimension = result.dimension;
                    app.variables = result.variables;
                    app.parsed = true;
                    this.latex();
                    if (app.is_matrix && app.variables.length == 1
                        && (app.dimension[0] == 2 || app.dimension[0] == 3)
                        && app.dimension[1] == 1)
                        app.pplot();
                    else if (app.variables.length == 1 && ['phi', 'theta', 'r', 'Phi', 'Theta', 'R'].indexOf(app.variables[0]) >= 0)
                        app.polar();
                    else if ((app.variables.length == 2 || app.variables.length == 1)
                        && (app.is_algebraic || (app.is_matrix && app.variables.length == 1)))
                        app.plot();
                    else if (app.is_square_matrix)
                        app.graph();
                    else if (
                        (app.dimension[0] == 2 || app.dimension[0] == 3 || app.dimension[1] == 2 || app.dimension[1] == 3)
                        && app.variables.length == 0)
                        app.vplot();
                    else if (app.variables.length == 0 && app.is_matrix && app.dimension[0] >= 2 && app.dimension[1] >= 2)
                        app.mplot();
                },
                (error) => {
                    console.log(error);
                    app.expression_error = true;
                }
            );
        },
        simplify: function () {
            this.resetAction();
            http.post('/simplify', {'expression': this.expr()},
                (result) => {
                    this.action_in = '化简表达式 $' + result.in + '$ 的结果是：';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        expand: function (trig = false) {
            this.resetAction();
            http.post('/expand', {'expression': this.expr(), 'trig': trig},
                (result) => {
                    this.action_in = '展开表达式 $' + result.in + '$ 的结果是：';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        factor: function () {
            this.resetAction();
            http.post('/factor', {'expression': this.expr()},
                (result) => {
                    this.action_in = '表达式 $' + result.in + '$ 的因式有：';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        factors: function () {
            this.resetAction();
            http.post('/factors', {'expression': this.expr()},
                (result) => {
                    this.action_in = '表达式 $' + result.in + '$ 的因子列表:';
                    this.action_out = '$$' + result.out + '$$';
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        primitive: function () {
            this.resetAction();
            http.post('/primitive', {'expression': this.expr()},
                (result) => {
                    this.action_in = 'The primitive of $' + result.in + '$ is:';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        diff: function (to) {
            this.resetAction();
            http.post('/diff', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '对表达式 $' + result.in + '$ 的变量 $' + result.var + '$ 的一阶导数结果:';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        diff2: function (to) {
            this.resetAction();
            http.post('/diff2', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '对表达式 $' + result.in + '$ 的变量 $' + result.var + '$ 的二阶导数结果:';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        grad: function (to) {
            this.resetAction();
            http.post('/grad', {'expression': this.expr()},
                (result) => {
                    this.action_in = '函数 $' + result.in + '$ 的梯度 $\\nabla f$ :';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        hessian: function (to) {
            this.resetAction();
            http.post('/hessian', {'expression': this.expr()},
                (result) => {
                    this.action_in = '表达式 $' + result.in + '$ 的海森矩阵$H$为:';
                    this.action_out = '$$' + result.out + ',$$ $\\textrm{det}(H)$ 的结果:$$' + result.hessian + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        integrate: function (v, from = '', to = '') {
            this.resetAction();
            http.post('/integrate', {'expression': this.expr(), 'var': v, 'from': from, 'to': to},
                (result) => {
                    let limits = to ? '_{' + from.replace('oo', '\\infty') + '}^{' + to.replace('oo', '+\\infty') + '}' : '';
                    this.action_in = '积分 $\\int ' + limits + result.in + '\\ d' + result.var + '$ 的结果:';
                    this.action_out = '$$' + result.out + (result.out.indexOf('int') < 0 && !to ? ' + C$$' : '$$');
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        solveFor: function (v) {
            this.resetAction();
            http.post('/solvefor', {'expression': this.expr(), 'var': v},
                (result) => {
                    this.action_in = '方程 $' + result.in + '$ 对变量 $' + result.var + '$ 的求解结果:';
                    append_var = !app.is_inequality ? result.var + '=' : '';
                    this.action_out = '$$' + append_var + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        plot: function () {
            this.resetPlot();
            http.post('/plot', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        cplot: function () {
            this.resetPlot();
            http.post('/cplot', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        pplot: function () {
            this.resetPlot();
            http.post('/pplot', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        mplot: function () {
            this.resetPlot();
            http.post('/mplot', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        tplot: function () {
            this.resetPlot();
            http.post('/tplot', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        vplot: function () {
            this.resetPlot();
            http.post('/vplot', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        polar: function () {
            this.resetPlot();
            http.post('/polar_plot', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        graph: function () {
            this.resetPlot();
            http.post('/graph', {'expression': this.expr(), 'xlim': this.plot_xlim, 'ylim': this.plot_ylim},
                (result) => {
                    app.plot_base64 = result.img;
                },
                (error) => {
                    console.warn(error);
                    app.plot_error = error;
                }
            );
        },
        transpose: function (to) {
            this.resetAction();
            http.post('/transpose', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '矩阵 $M = ' + result.in + '$ 的转置:';
                    this.action_out = '$$M^\\textrm{T} = ' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        inverse: function (to) {
            this.resetAction();
            http.post('/inverse', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '矩阵 $M = ' + result.in + '$ 的逆矩阵:';
                    this.action_out = '$$M^{-1} = ' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        det: function (to) {
            this.resetAction();
            http.post('/det', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '矩阵 $ M = ' + result.in + '$ 的行列式:';
                    this.action_out = '$$\\textrm{det}(M) = ' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        eigen: function (to) {
            this.resetAction();
            http.post('/eigen', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '矩阵 $M = ' + result.in + '$ 的特征向量:';
                    this.action_out = '特征向量$$' + result.vectors + '$$ ，其特征值为（冒号后是重数） $' + result.values + '$.';
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        vlength: function (to) {
            this.resetAction();
            http.post('/vlength', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '向量 $M = ' + result.in + '$ 长度:';
                    this.action_out = '$$' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        graphComplement: function (to) {
            this.resetAction();
            http.post('/graph_complement', {'expression': this.expr(), 'var': to},
                (result) => {
                    this.action_in = '图 $G = ' + result.in + '$ 的补图:';
                    this.action_out = '$$G^\\textrm{C} = ' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        graphDegree: function () {
            this.resetAction();
            http.post('/graph_degree', {'expression': this.expr()},
                (result) => {
                    this.action_in = '图 $G = ' + result.in + '$ 的度矩阵:';
                    this.action_out = '$$\\textrm{deg}(G) = ' + result.out + '$$';
                    this.action_link = result.out_expression;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        graphMst: function () {
            this.resetAction();
            http.post('/graph_mst', {'expression': this.expr()},
                (result) => {
                    this.action_in = '图 $G = ' + result.in + '$ 的最小生成树:';
                    this.action_out = '$$\\textrm{MST}(G) = ' + result.out + '$$ 最小生成树的权值 $' + result.weight + '$.';
                    this.action_link = result.out_expression;
                    this.action_image = result.image;
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        graphDijkstra: function () {
            this.resetAction();
            http.post('graph_dijkstra', {'expression': this.expr()},
                (result) => {
                    this.action_in = '从 ... 到 ... 的最短路径:'; // +weight
                    this.action_out = '$$\\textrm{Not implemented}$$';
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        graphInfo: function () {
            this.resetAction();
            http.post('graph_info', {'expression': this.expr()},
                (result) => {
                    this.action_in = '图 $G$ 包含了下述属性:'; // +weight
                    this.action_out = "";
                    this.action_out_list.push('图 $G$ 节点的度序列 $' + result.out['degrees'] + '$.');
                    this.action_out_list.push('度序列的和 $' + result.out['degrees_sum'] + '$.');
                    this.latex();
                },
                (error) => this.actionError(error)
            );
        },
        showParameters(func, func_name, name_a, name_b = "", name_c = "", explain = "") {
            this.resetAction();
            this.parameter_show = true;
            this.parameter_a_name = name_a;
            this.parameter_b_name = name_b;
            this.parameter_c_name = name_c;
            this.parameter_func = func;
            this.parameter_func_name = func_name;
            this.parameter_explain = explain;
            this.latex();
        },
        actionError: function (e) {
            this.action_error = e;
            console.warn(e);
        },
        reset: function () {
            this.expression_error = false;
            this.is_algebraic = false;
            this.is_equality = false;
            this.is_inequality = false;
            this.is_matrix = false,
                this.is_square_matrix = false,
                this.is_ugly = false;
            this.is_graph = false,
                this.is_directed = false,
                this.is_weighted = false,
                this.dimension = [0, 0],
                this.parsed = false;
            this.expression_parsed = false;
            this.expression_latex = false;
            this.variables = [];
            this.plot_show = false;
            this.plot_base64 = "";
            this.plot_error = "";
            this.resetAction();
            this.action_show = false;
        },
        resetAction: function () {
            this.resetParameters();
            this.action_show = true;
            this.action_in = "";
            this.action_out = "";
            this.action_error = "";
            this.action_link = false;
            this.action_image = "";
            this.action_out_list = [];
        },
        resetParameters: function () {
            this.parameter_show = false;
            this.parameter_func = function () {
            };
            this.parameter_a_name = "Parameter 1";
            this.parameter_a_value = "";
            this.parameter_b_name = "Parameter 2";
            this.parameter_b_value = "";
            this.parameter_c_name = "Parameter 3";
            this.parameter_c_value = "";
            this.parameter_func_name = "Func";
            this.parameter_explain = "";
        },
        resetPlot: function () {
            this.plot_show = true;
            this.plot_base64 = "";
            this.plot_error = "";
        },
        setUrl: function () {
            if (!this.expression) window.history.pushState({page: "index"}, "reset", "/");
            else window.history.pushState({page: "index"}, "expression",
                "?expr=" + encodeURIComponent(this.expression)
                + "&xlima=" + encodeURIComponent(this.plot_xlim[0])
                + "&xlimb=" + encodeURIComponent(this.plot_xlim[1])
                + "&ylima=" + encodeURIComponent(this.plot_ylim[0])
                + "&ylimb=" + encodeURIComponent(this.plot_ylim[1])
            );
        },
        getUrl: function () {
            let url = new URL(window.location.href);
            let expr = url.searchParams.get('expr');
            return expr;
        },
        latex: function () {
            this.$nextTick(function () {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
            });
        },
        rand: function () {
            let expressions = [
                '(-3*x)/(x^2+y^2+1)',
                'sin(1/2*x*y)',
                'exp(y) * cos(x) + exp(x) * sin(y)',
                'sqrt(4*x^2 + y^2) + cos(4*x) * y',
                '1 / (1 + x^2 + y^2)',
                'Matrix([cos(4*t),sin(4*t),t])',
                '[[a,b,c],[d,e,f],[g,h,i]]',
                '[[a,b],[c,d]]',
                '[-1-t,0-t,1-t] * [t,t**2,t**3].T'
            ];
            this.set(expressions[Math.floor(Math.random() * expressions.length)]);
        },
        set: function (expr) {
            this.expression = expr;
            this.parse();
        },
        setLimits: function () {
            let url = new URL(window.location.href);
            let xlima = url.searchParams.get('xlima');
            let xlimb = url.searchParams.get('xlimb');
            let ylima = url.searchParams.get('ylima');
            let ylimb = url.searchParams.get('ylimb');
            if (xlima && xlimb) this.plot_xlim = [Number(xlima), Number(xlimb)]
            if (ylima && ylimb) this.plot_ylim = [Number(ylima), Number(ylimb)]
        },
        start: function () {
            this.setLimits();
            this.set(this.getUrl());
        }
    }
})

app.start();

window.onpopstate = function (e) {
    if (e.state) {
        document.getElementById("function").blur();
        app.getUrl();
        app.parse();
    }
}