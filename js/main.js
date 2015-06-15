if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

function loadStage(stage) {
    stuff('secure/index.html', document.getElementById("preview"), function(context) {
        var files = {};
        var compiled_template = Hogan.compile(stage.template);
        var t = null;

        function reload() {
            clearTimeout(t);
            t = setTimeout(function() {
                var ctx = {};
                for (var file in files) {
                    ctx[file] = files[file].getValue();
                }
                var code = compiled_template.render(ctx);
                context.load(code);
            }, 50);
        }

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
        for (var file in stage.files) {
            $('#file-tabs').append('<li><a href="#{0}">{1}</a></li>'.format(stage.files[file].mapping, file));
            $('#editors').append('<section id="{0}"><textarea id="editor-{0}"></textarea></section>'.format(stage.files[file].mapping))
            files[stage.files[file].mapping] = CodeMirror.fromTextArea(document.getElementById('editor-{0}'.format(stage.files[file].mapping)),
                stage.files[file].cmOption
            );
        }
        for (var file in files) {
            files[file].on('change', reload);
        }
        initTabs();
        reload();
    });
}