$(() => {
  // Search Items
  $('#search').on('keyup', function (e) {
    const value = $(this).val();
    const $el = $('.navigation');

    if (value) {
      const regexp = new RegExp(value, 'i');
      $el.find('li, .itemMembers').hide();

      $el.find('li').each((i, v) => {
        const $item = $(v);

        if ($item.data('name') && regexp.test($item.data('name'))) {
          $item.show();
          $item.closest('.itemMembers').show();
          $item.closest('.item').show();
        }
      });
    } else {
      $el.find('.item, .itemMembers').show();
    }

    $el.find('.list').scrollTop(0);
  });

  // Toggle when click an item element
  $('.navigation').on('click', '.title', function (e) {
    $(this).parent().find('.itemMembers').toggle();
  });

  // Show an item related a current documentation automatically
  const filename = $('.page-title').data('filename')
    .replace(/\.[a-z]+$/, '')
    .replace('module-', 'module:')
    .replace(/_/g, '/')
    .replace(/-/g, '~');
  const $currentItem = $(`.navigation .item[data-name*="${filename}"]:eq(0)`);

  if ($currentItem.length) {
    $currentItem
      .remove()
      .prependTo('.navigation .list')
      .show()
      .find('.itemMembers')
      .show();
  }

  // Auto resizing on navigation
  const _onResize = function () {
    const height = $(window).height();
    const $el = $('.navigation');

    $el.height(height).find('.list').height(height - 133);
  };

  $(window).on('resize', _onResize);
  _onResize();

  // Highlighting current anchor

  const anchors = $('.anchor');
  const _onHashChange = function () {
    const activeHash = window.document.location.hash
      .replace(/\./g, '\\.') // Escape dot in element id
      .replace(/\~/g, '\\~'); // Escape tilde in element id

    anchors.removeClass('highlighted');

    if (activeHash.length > 0) {
      anchors.filter(activeHash).addClass('highlighted');
    }
  };

  $(window).on('hashchange', _onHashChange);
  _onHashChange();
});
