"use strict";

String.prototype.repeat = function (count) {
    if (count < 1) return '';
    var result = '',
        pattern = this.valueOf();
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
};

var DiffManager = (function () {
    var file1 = null;
    var file2 = null;
    var dmp = new diff_match_patch();
    var diff_kinds = {};
    diff_kinds[-1] = "delete";
    diff_kinds[0] = "same";
    diff_kinds[1] = "add";
    var file1_lines = [];
    var file2_lines = [];

    var readFile = function readFile(file) {
        var defer = $.Deferred();
        if (!file) {
            return defer.reject("No file selected.");
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            defer.resolve(e.target.result);
        };
        reader.readAsText(file);
        return defer.promise();
    };

    var makeDiffs = function makeDiffs() {
        if (file1 && file2) {
            file1_lines = [];
            file2_lines = [];

            return dmp.diff_main(file1, file2).map(function (diff) {
                var out = {
                    kind: diff_kinds[diff[0]],
                    text: diff[1]
                };
                if (diff[0] == 0) {
                    [file1_lines, file2_lines].forEach(function (arr) {
                        if (arr.length > 0 && arr[arr.length - 1].kind == "null" && out.text.startsWith('\n')) {
                            arr.push({
                                text: out.text.slice(1),
                                kind: out.kind
                            });
                        } else {
                            arr.push(out);
                        }
                    });
                } else {
                    var affected = diff[0] == 1 ? file1_lines : file2_lines;
                    var newlines = (diff[1].match(/\n/g) || []).length;
                    var other = diff[0] == -1 ? file1_lines : file2_lines;
                    if (newlines > 0) {
                        affected.push({
                            kind: "null",
                            text: "\n".repeat(newlines)
                        });
                    }
                    other.push(out);
                }

                return out;
            });
        } else {
            return null;
        }
    };

    return {
        setFileFromDisk: function setFileFromDisk(filename, file) {
            return readFile(file).then(function (content) {
                if (filename === "1") file1 = content;
                if (filename === "2") file2 = content;
            });
        },
        setFileText: function setFileText(filename, text) {
            if (filename === "1") file1 = text;
            if (filename === "2") file2 = text;
        },
        getDiffs: function getDiffs() {
            return makeDiffs();
        },
        getFiles: function getFiles() {
            return [file1_lines, file2_lines];
        }
    };
})();

var DiffApp = React.createClass({
    displayName: 'DiffApp',

    getInitialState: function getInitialState() {
        return {
            diffs: [],
            leftFile: [],
            rightFile: []
        };
    },
    onPickFile: function onPickFile(filename, file) {
        var self = this;
        DiffManager.setFileFromDisk(filename, file).then(function () {
            var result = DiffManager.getDiffs();
            var files = DiffManager.getFiles();
            if (result !== null) {
                self.setState({ diffs: result });
            }
            self.setState({
                leftFile: files[0],
                rightFile: files[1]
            });
        });
    },
    render: function render() {
        return React.createElement(
            'div',
            { className: 'diffApp' },
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'col-sm-4 file-1' },
                    React.createElement(FileInput, { onChange: this.onPickFile, filename: '1' }),
                    React.createElement(FileView, { content: this.state.leftFile, filename: '1' })
                ),
                React.createElement(
                    'div',
                    { className: 'col-sm-4 file-diff' },
                    React.createElement(
                        'h3',
                        { className: 'hidden-xs' },
                        'Quick Diff'
                    ),
                    React.createElement(
                        'span',
                        { className: 'visible-xs-block smallTitle' },
                        'Diff'
                    ),
                    React.createElement(DiffsList, { diffs: this.state.diffs })
                ),
                React.createElement(
                    'div',
                    { className: 'col-sm-4 file-2' },
                    React.createElement(FileInput, { onChange: this.onPickFile, filename: '2' }),
                    React.createElement(FileView, { content: this.state.rightFile, filename: '2' })
                )
            )
        );
    }
});

var FileInput = React.createClass({
    displayName: 'FileInput',

    handleChange: function handleChange(e) {
        this.props.onChange(this.props.filename, e.target.files[0]);
    },
    render: function render() {
        return React.createElement(
            'span',
            { className: 'fileInput' },
            React.createElement(
                'div',
                { className: 'smallTitle' },
                'File ',
                this.props.filename
            ),
            React.createElement('input', { type: 'file', onChange: this.handleChange })
        );
    }
});

var FileView = React.createClass({
    displayName: 'FileView',

    render: function render() {
        var lines = this.props.content.map(function (d, idx) {
            if (d.kind == "null") {
                return React.createElement(
                    'div',
                    { key: idx },
                    d.text
                );
            }
            return React.createElement(DiffView, { key: idx, text: d.text, kind: d.kind });
        });
        return React.createElement(
            'pre',
            { onChange: this.handleChange, className: 'fileView' },
            lines
        );
    }
});

var DiffsList = React.createClass({
    displayName: 'DiffsList',

    render: function render() {
        var diffnodes = this.props.diffs.map(function (d, idx) {
            return React.createElement(DiffView, { key: idx, text: d.text, kind: d.kind });
        });
        return React.createElement(
            'pre',
            { className: 'diffsList' },
            diffnodes
        );
    }
});

var DiffView = React.createClass({
    displayName: 'DiffView',

    render: function render() {
        var classes = "diffView diff-" + this.props.kind;
        return React.createElement(
            'span',
            { className: classes },
            this.props.text
        );
    }
});

