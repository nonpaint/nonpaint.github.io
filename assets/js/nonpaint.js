$().on('load', async e => {
  const {aimClient,dmsClient} = aim;
  console.log('AIM', aimClient, dmsClient, aim.config);
  let clientart = [];
  let clientName = null;
  console.log(1111, aimClient);
  async function selectClient(name){
    localStorage.setItem('clientName', clientName = name);
    $('button.account span.company').text(clientName||'');
    [clientart] = await fetch('https://aliconnect.nl/api/abis/data?request_type=clientArt&clientName=' + clientName).then(res => res.json());
    aim.idfilter = `clientName EQ '${clientName}'`;
  }
  function num(value, dig = 2){
    return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: dig, maximumFractionDigits: dig }).format(value);
  }
  aim.om.treeview({
    'Shop': {
      Producten: e => aim.list('product',{
        $filter: clientName ? `klantnaam eq '${clientName}'` : 'klantnaam eq null',
        $search: ``,
      }),
      Boodschappenlijst() {
        aim.list('art',{
          $filter: `id IN (SELECT artId FROM abisingen.dbo.klantartikelen WHERE klantid = '${clientName}')`,
          $search: '*',
        });
      },
      Winkelmandje() {
        aim.list('salesorderrow',{$filter: `clientName EQ '${clientName}' and isOrder EQ 0`});
      },
    },
  });
  aim.config.components.schemas.product.app = {
    header(row){
      const elem = $('div').class('price');
      var price;

      row.orderContent = row.orderContent == 1 ? row.partContent || 1 : row.orderContent;

      row.orderPackPrice = row.orderPackPrice || row.orderPartPrice * row.orderContent;
      row.orderDiscount = row.artikelInkKorting;
      if (!row.orderDiscount) {
        row.orderPackPrice *= 1.5;
        row.orderDiscount = 50;
      }

      row.orderPartPrice = row.orderPackPrice / row.orderContent;
      if (row.supplier) {
        var discount = row.orderDiscount;
        var style = 'color:lightgreen;font-size:1.2em';
        elem.append(
          $('div').append(
            $('span').text('€ ' + num(row.orderPackPrice)).style('text-decoration:line-through;'),
            ' (-' + num(discount).replace(/,00$|0$/g,'') + '%) € ',
            $('span').text(num(price = row.orderPackPrice*(100-discount)/100)).style(style),
            ' ',
            row.orderContent == 1 ? null : ' € ' + num(row.orderPartPrice*(100-discount)/100) + '/' + row.orderContentUnit,
            ' (€ ' + num(price * 1.21) + ' incl. btw) ',
            row.supplier,
          ),
        );
      }
      var discount = row.orderDiscount * 0.4;
      var style = 'color:lightblue;font-size:1.2em';
      elem.append(
        $('div').append(
          $('span').text('€ ' + num(row.orderPackPrice)).style('text-decoration:line-through;'),
          ' (-' + num(discount).replace(/,00$|0$/g,'') + '%) € ',
          $('span').text(num(price = row.orderPackPrice*(100-discount)/100)).style(style),
          ' ',
          row.orderContent == 1 ? null : ' € ' + num(row.orderPartPrice*(100-discount)/100) + '/' + row.orderContentUnit,
          ' (€ ' + num(price * 1.21) + ' incl. btw) ',
        ),
      );
      if (row.clientDiscount) {
        var discount = row.clientDiscount;
        var style = 'color:orange;font-size:1.2em';

        elem.append(
          $('div').append(
            $('span').text('€ ' + num(row.orderPackPrice)).style('text-decoration:line-through;'),
            ' (-' + num(discount).replace(/,00$|0$/g,'') + '%) € ',
            $('span').text(num(price = row.orderPackPrice*(100-discount)/100)).style(style),
            ' ',
            row.orderContent == 1 ? null : ' € ' + num(row.orderPartPrice*(100-discount)/100) + '/' + row.orderContentUnit,
            ' (€ ' + num(price * 1.21) + ' incl. btw) ',
            row.clientName,
          ),
        );
      }
      elem.append(
        $('div').append(
          'Verzending in: ',
          $('b').text(row.verzending).style('color:green;'),
          elem.input = $('input').type('number').step(1).min(0).value(row.quant).on('change', e => {
            row.quant = Number(e.target.value);
            console.log(row.quant);
          }).on('click', e => {
            e.stopPropagation();
          }),
        )
      );


      return elem;

      const myart = clientart.find(a => a.artId === row.id);
      if (myart) {
        row.discount = myart.clientDiscount;
      }
      row.listPrice = Number(row.listPrice);
      row.purchaseDiscount = Number(row.purchaseDiscount);
      if (row.purchaseDiscount = Number(row.purchaseDiscount)) {
        row.purchasePrice = row.listPrice * (100 - row.purchaseDiscount) / 100;
      } else if (row.purchasePrice = Number(row.purchasePrice)) {
        row.purchaseDiscount = row.purchasePrice / row.listPrice * 100;
      }
      row.price = row.listPrice * (100 - row.discount) / 100;
      // console.log(row);
      // const elem = $('div').class('price');
      if (row.discount) {
        elem.class('price discount', myart ? 'client' : '').append(
          $('span').attr('listprice', num(row.listPrice)),
          $('span').attr('discount', num(-row.discount,0)),
        );
      }
      elem.append(
        $('span').attr('price', num(row.price)),
        $('span').attr('fatprice', num(row.price * 1.21)),
        row.purchasePrice ? $('span').attr('purchaseprice', num(row.purchasePrice)) : null,
        row.purchaseDiscount ? $('span').attr('purchasediscount', num(row.purchaseDiscount)) : null,

        $('span'),
        elem.input = $('input').type('number').step(1).min(0).value(row.quant).on('change', e => {
          row.quant = Number(e.target.value);
          console.log(row.quant);
        }).on('click', e => {
          e.stopPropagation();
        }),
      );
      return elem;
    },
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

});
