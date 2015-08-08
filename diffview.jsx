"use strict";

String.prototype.repeat = function(count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
};

var DiffManager = (function() {
    var file1 = null;
    var file2 = null;
    var dmp = new diff_match_patch();
    var diff_kinds = {};
    diff_kinds[-1] = "delete";
    diff_kinds[0] = "same";
    diff_kinds[1] = "add";
    var file1_lines = [];
    var file2_lines = [];

    var readFile = function(file) {
        var defer = $.Deferred();
        if (!file) {
            return defer.reject("No file selected.");
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            defer.resolve(e.target.result);
        }
        reader.readAsText(file);
        return defer.promise();
    };

    var makeDiffs = function() {
        if (file1 && file2) {
            file1_lines = [];
            file2_lines = [];

            return dmp.diff_main(file1, file2).map(function(diff) {
                console.log(diff);
                var out = {
                    kind: diff_kinds[diff[0]],
                    text: diff[1]
                };
                if (diff[0] == 0) {
                    [file1_lines, file2_lines].forEach(function(arr) {
                        if (arr.length > 0 && arr[arr.length-1].kind == "null" && out.text.startsWith('\n')) {
                            arr.push({
                                text: out.text.slice(1),
                                kind: out.kind
                            });
                        }
                        else {
                            arr.push(out);
                        }
                    });
                }
                else {
                    var affected = (diff[0] == 1 ? file1_lines : file2_lines);
                    var newlines = (diff[1].match(/\n/g) || []).length;
                    var other = (diff[0] == -1 ? file1_lines : file2_lines);
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
        }
        else {
            return null;
        }
    }

    return {
        setFileFromDisk: function(filename, file) {
            return readFile(file).then(function(content) {
                if (filename === "1") file1 = content;
                if (filename === "2") file2 = content;
            });
        },
        setFileText: function(filename, text) {
            if (filename === "1") file1 = text;
            if (filename === "2") file2 = text;
        },
        getDiffs: function() {
            return makeDiffs();
        },
        getFiles: function() {
            return [file1_lines, file2_lines];
        }
    }
})();
var DiffApp = React.createClass({
    getInitialState: function() {
        return {
            diffs: [],
            leftFile: [],
            rightFile: []
        };
    },
    onPickFile: function(filename, file) {
        var self = this;
        DiffManager.setFileFromDisk(filename, file).then(function() {
            var result = DiffManager.getDiffs();
            var files = DiffManager.getFiles();
            if (result !== null) {
                self.setState({diffs: result});
            }
            self.setState({
                leftFile: files[0],
                rightFile: files[1]
            });
        });
    },
    render: function() {
        return (
            <div className="diffApp">
                <div className="row">
                    <div className="col-sm-4 file-1">
                        <FileInput onChange={this.onPickFile} filename="1" />
                        <FileView content={this.state.leftFile} filename="1" />
                    </div>
                    <div className="col-sm-4 file-diff">
                        <h3 className="hidden-xs">Quick Diff</h3>
                        <span className="visible-xs-block smallTitle">Diff</span>
                        <DiffsList diffs={this.state.diffs} />
                    </div>
                    <div className="col-sm-4 file-2">
                        <FileInput onChange={this.onPickFile} filename="2" />
                        <FileView content={this.state.rightFile} filename="2" />
                    </div>
                </div>
            </div>
        );
    }
});

var FileInput = React.createClass({
    handleChange: function(e) {
        this.props.onChange(this.props.filename, e.target.files[0]);
    },
    render: function() {
        return (
            <span className="fileInput"><div className="smallTitle">File {this.props.filename}</div> 
        <input type="file" onChange={this.handleChange} />
      </span>
        );
    }
});

var FileView = React.createClass({
    handleChange: function(e) {
        //this.props.onChange(this.props.filename, e.target.files[0]);
    },
    render: function() {
        var lines = this.props.content.map(function(d) {
            if (d.kind == "null") {
                return (<div>{d.text}</div>);
            }
            return (<DiffView text={d.text} kind={d.kind} />);
        });
        var cx = React.addons.classSet;
        var classes = cx("fileView");
        return (
            <pre onChange={this.handleChange} className={classes}>
                {lines}
            </pre>
        );
    }
});

var DiffsList = React.createClass({
    render: function() {
        var diffnodes = this.props.diffs.map(function(d) {
            return (
                <DiffView text={d.text} kind={d.kind} />
            );
        });
        return (<pre className="diffsList">
          {diffnodes}
          </pre>);
    }
});

var DiffView = React.createClass({
    render: function() {
        var cx = React.addons.classSet;
        var classes = cx("diffView", "diff-"+this.props.kind);
        return (<span className={classes}>{this.props.text}</span>)
    }
})
