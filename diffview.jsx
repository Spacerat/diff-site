"use strict";

var DiffManager = (function() {
    var file1 = null;
    var file2 = null;
    var dmp = new diff_match_patch();
    var diff_kinds = {};
    diff_kinds[-1] = "delete";
    diff_kinds[0] = "same";
    diff_kinds[1] = "add";

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
            return dmp.diff_main(file1, file2).map(function(diff) {
                return {
                    kind: diff_kinds[diff[0]],
                    text: diff[1]
                }
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
            return [file1, file2];
        }
    }
})();
var DiffApp = React.createClass({
    getInitialState: function() {
        return {
            diffs: []
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
            <table>
                <tr>
                    <th><FileInput onChange={this.onPickFile} filename="1" /></th>
                    <th>Diff</th>
                    <th><FileInput onChange={this.onPickFile} filename="2" /></th>
                </tr>
                <tr>
                    <td><FileView content={this.state.leftFile} filename="1" /></td>
                    <td className="diffCell"><DiffsList diffs={this.state.diffs} /></td>
                    <td><FileView content={this.state.rightFile} filename="2" /></td>
                </tr>
            </table>
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
            <div className="fileInput">
        <input type="file" onChange={this.handleChange} />
      </div>
        );
    }
});

var FileView = React.createClass({
    handleChange: function(e) {
        //this.props.onChange(this.props.filename, e.target.files[0]);
    },
    render: function() {
        return (<textarea onChange={this.handleChange} rows="14" cols="20" className="fileView" value={this.props.content}>{this.props.content}</textarea>);
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
