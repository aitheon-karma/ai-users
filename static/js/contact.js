$(document).ready(function () {
    $('#contact_form').submit(function () {
        $('#contact_form fieldset').prop('disabled', true);
        $('#btnContact').text('Sending...');
        $(this).ajaxSubmit({
            error: function (xhr) {
                $('#contact_result').show().addClass('text-danger').text('Error: ' + xhr.status);
                $('#btnContact').text('Send');
            },
            success: function (response) {
                $('#contact_form fieldset').prop('disabled', false);
                if (response.responseCode === 0) {
                    $('#contact_success').show().text(response.responseDesc);
                    $('#contact_form').remove();
                } else {
                    $('#contact_error').show().text(response.responseDesc);
                    $('#btnContact').text('Send');
                }
            }
        });
        return false;
    });
});