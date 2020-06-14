import React from 'react';

import Button from '../../Button/Button';
import './Product.css';

const product = props => (
  <article className="product">
    <header className="product__header">
      <h3 className="product__meta">
        Posted by {props.author} on {props.date}
      </h3>
      <h1 className="product__title">{props.title}</h1>
    </header>
    <div className="product__actions">
      <Button mode="flat" link={props.id}>
        View
      </Button>
      <Button mode="flat" onClick={props.onStartEdit}>
        Edit
      </Button>
      <Button mode="flat" design="danger" onClick={props.onDelete}>
        Delete
      </Button>
    </div>
  </article>
);

export default product;
