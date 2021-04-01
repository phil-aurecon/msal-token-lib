import { describe } from 'riteway';
import render from 'riteway/render-component';
import React from 'react';

import ClickComponent from '../src/click-component';

describe('ClickComponent should render properly', async (assert) => {

  const createCounter = clickCount =>
    render(<ClickComponent clicks={ clickCount } />)

    const count = 3;
    const $ = createCounter(count);

    assert({
      given: 'a click component',
      should: 'Should render no clicks.',
      actual: $('span')
        .html()
        .trim(),
      expected: ''+count
    });
});
