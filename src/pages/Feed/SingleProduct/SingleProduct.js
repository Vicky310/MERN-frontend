import React, { Component } from 'react';
import './SingleProduct.css';

class SingleProduct extends Component {
  state = {
    title: '',
    author: '',
    price: '',
    date: '',
    description: ''
  };

  componentDidMount() {
    const productId = this.props.match.params.productId;
    const graphqlQuery = {
      query: `query FetchSingleProduct($productId: ID!) {
          product(id: $productId) {
            title
            price
            description
            creator {
              name
            }
            createdAt
          }
        }
      `,
      variables: {
        productId: productId
      }
    };
    fetch('https://mern-demo-vicky.herokuapp.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error('Fetching product failed!');
        }
        this.setState({
          title: resData.data.product.title,
          author: resData.data.product.creator.name,
          date: new Date(resData.data.product.createdAt).toLocaleDateString('en-US'),
          price: resData.data.product.price,
          description: resData.data.product.description
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-product">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <h1>Price: ${this.state.price}</h1>
        <p>{this.state.description}</p>
      </section>
    );
  }
}

export default SingleProduct;
