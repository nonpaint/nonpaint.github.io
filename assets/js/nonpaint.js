$().on('load', async e => {
  const searchParams = new URLSearchParams(document.location.search);
  function signOut() {
    // aimClient.storage.removeItem('aimAccount');
    aimClient.logout().catch(console.error).then(e => document.location.reload());
  }
  async function signIn(){
    const authResult = await aimClient.loginPopup(aimRequest);
    // const authProvider = new aimClient.AuthProvider(aimClient, {
    //   // account: authResult.account,
    //   scopes: aimRequest.scopes,
    // });

    const user = await dmsClient
    .api('/me')
    // .select('id,displayName,mail,userPrincipalName,mailboxSettings')
    .select('id,name,accountname')
    .get();
    console.log(user);
    aimClient.store('aimUser', JSON.stringify(user));
    $('.account span.user').text(user.name || user.accountname);
    // sessionStorage.setItem('aimUser', JSON.stringify(user));
  }

  function search(search){
    dmsClient.api('/product').query({
      search: search,
      select: 'id,titel,ppe,merk',
    }).get().then(body => {
      const {rows} = body;
      console.log(rows);
      aim.listview(rows);
    })
  }

  $(document.documentElement).class('app') ;
  $(document.documentElement).attr('dark', localStorage.getItem('dark'));
  $(document.body).append(
    $('nav').append($('article').append(
      $('button').class('abtn menu').on('click', e => $(document.documentElement).class(getItem('isApp', getItem('isApp') !== 'app' ? 'app' : 'page' ))),
      $('form').class('search row aco')
      .on('submit', e => {
        e.preventDefault();
        // $('.pv').text('');
        const url = new URL(document.location);
        url.searchParams.set('search', e.target.search.value);
        window.history.replaceState('','',url.href);
        search(e.target.search.value);
      })
      .append(
        $('input').name('search').autocomplete('off').placeholder('zoeken').value(searchParams.get('search')),
        $('button').class('abtn icn search fr').title('Zoeken'),
      ),

      $('span').class('pagemenu'),
      $('button').class('abtn dark').on('click', e => $(document.documentElement).attr('dark', getItem('dark', getItem('dark')^1))),
      $('button').class('abtn shop'),
      $('button').class('abtn account').append(
        $('span').append(
          $('span').class('company'),
          $('span').class('user'),
        ),
        $('div').append(
          $('button').text('aanmelden').on('click', signIn),
          $('button').text('afmelden').on('click', signOut),
          $('button').text('gegevens').on('click', e => {
            dmsClient.api('/me').select('*').get().then(row => {
              row.schemaName = 'Contact';
              pageviewrow(row);
            });
          }),
        )
      ),
    )),
    $('header').append($('article')),
    $('main').append($('article').append(
      $('aside').class('left'),
      $('div').class('lv'),
      $('section').class('pv doc-content').css('max-width', $().storage('view.width') || '700px'),
      $('div').class('dv'),
      $('aside').class('right'),
      $('div').class('prompt'),
    )),
    $('footer').class('page').append(
      $('article'),
    ),
  );


  const aimConfig = {
    client_id: aim.config.client_id,
    scope: 'openid profile name email',
  };
  const aimClient = new aim.PublicClientApplication(aimConfig);
  const config = await aimClient.getConfig();
  Object.assign(aim.config, config);
  const aimRequest = {
    scopes: aimConfig.scope.split(' '),
  };
  const dmsConfig = aim.dmsConfig = {
    servers: [{url: aim.dmsUrl}],
  };
  const authProvider = new aimClient.AuthProvider(aimClient, {
    // account: authResult.account,
    scopes: aimRequest.scopes,
  });
  const dmsClient = aim.dmsClient = aim.Client.initWithMiddleware({authProvider}, aim.dmsConfig);

  if (aimClient.store('aimUser')) {
    const user = JSON.parse(aimClient.store('aimUser'));
    // const authProvider = new aimClient.AuthProvider(aimClient, {
    //   // account: authResult.account,
    //   scopes: aimRequest.scopes,
    // });
    // dmsClient = aim.Client.initWithMiddleware({authProvider}, dmsConfig);
    $('.account span.user').text(user.name || user.accountname);
  }

  let clientart = [];
  let clientName = null;
  console.log(1111, aimClient, aim.config);
  async function selectClient(name){
    localStorage.setItem('clientName', clientName = name);
    $('button.account span.company').text(clientName||'');
    [clientart] = await fetch('https://aliconnect.nl/api/abis/data?request_type=clientArt&clientName=' + clientName).then(res => res.json());
    aim.idfilter = `clientName EQ '${clientName}'`;
  }
  function num(value, dig = 2){
    return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: dig, maximumFractionDigits: dig }).format(value);
  }
  aim.config.components.schemas.product.app = {
    header(row){
      const elem = $('div').class('price');
      var price;
      var listPrice = row.ppe;
      var discount = row.k;
      if (discount) {
        elem.append(
          $('div').append(
            $('span').text('€ ' + num(listPrice)).style('text-decoration:line-through;'),
            ' € ',
            $('span').text(num(price = listPrice*(100-discount)/100)).style('color:var(--discountprice);font-size:1.2em;'),
            ' (€ ' + num(price * 1.21) + ' incl. btw) ',
            ' korting ',
            $('span').text(num(discount).replace(/,00$|0$/g,'') + '%')
          ),
        );
      } else {
        elem.append(
          $('div').append(
            $('span').text('€ ' + num(price = listPrice)).style('color:var(--price);font-size:1.2em;'),
            ' (€ ' + num(price * 1.21) + ' incl. btw) ',
          ),
        );
      }
      elem.append(
        $('div').append(
          $('span').style('font-size:0.8em;').append(
            'Verzending in: ',
            $('b').text(row.lt).style('color:var(--lt);'),
            // row.stock ? [
            //   ' (nog ',
            //   $('b').text(row.stock).style('color:green;'),
            //   ' beschikbaar)',
            // ] : null,
          ),
          elem.input = $('input')
          .tabindex(-1)
          .type('number').step(1).min(0).value(row.quant).on('change', e => {
            row.quant = Number(e.target.value);
            console.log(row.quant);
          }).on('click', e => e.stopPropagation()),
        )
      );

      return elem;
    },
  }

  if (searchParams.get('search')) search(searchParams.get('search'));

});
