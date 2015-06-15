stuff('secure/index.html', document.getElementById("preview"), function(context) {
    var html = CodeMirror.fromTextArea(document.getElementById('editor-html'), {
        lineNumbers: true,
        mode: 'text/html',
        theme: 'cc',
        lineWrapping: true,
        styleActiveLine: true,
        autoCloseTags: true,
        matchTags: {
            bothTags: true
        },
        matchBrackets: true
    });
    var css = CodeMirror.fromTextArea(document.getElementById('editor-css'), {
        lineNumbers: true,
        mode: 'text/css',
        theme: 'cc',
        lineWrapping: true,
        styleActiveLine: true,
        matchBrackets: true,
        autoCloseBrackets: true
    });
    var js = CodeMirror.fromTextArea(document.getElementById('editor-js'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'cc',
        lineWrapping: true,
        styleActiveLine: true,
        matchBrackets: true,
        autoCloseBrackets: true
    });
    /*var js = CodeMirror.fromTextArea($('#js'), {
      onChange: reload
    , mode: 'javascript'
    });
    var css = CodeMirror.fromTextArea($('#css'), {
      onChange: reload
    , mode: 'css'
    });*/
    function initTabs() {
        $('ul.tabs li:first').addClass('active');
        $('.tabs-content > section').hide();
        $('.tabs-content > section:first').show();
        $('ul.tabs li').on('click', function() {
            $('ul.tabs li').removeClass('active');
            $(this).addClass('active')
            $('.tabs-content > section').hide();
            var activeTab = $(this).find('a').attr('href');
            $(activeTab).show();
            return false;
        });
    }
    html.on('change', reload);
    css.on('change', reload);
    js.on('change', reload);
    initTabs();
    var t = null;

    function reload() {
        clearTimeout(t);
        t = setTimeout(function() {
            var code = '<!DOCTYPE html><html><head>';
            code += '<style>'  + css.getValue() + '</style>';
            code += '<body>' + html.getValue();
            code += '<script>' + js.getValue() + '</script>'; 
            code += '</body></html>';
            context.load(code);
        }, 50);
    }
    reload();
});
$()
