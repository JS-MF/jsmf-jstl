===
# Presentation

The JSMF Framework aims at simplifying and lightening the traditional (MDE)
modelling frameworks such as EMF.
Moreover, we want to push forward web technologies which could bring a lot to
model engineering (easy deployement, client-based transformations, cloud, etc.).

Thus JSMF propose an overhaul of classical modelling frameworks into Javascript.
It does not aim at replacing all the features of EMF, but propose a rather 
simpler implementation of conformance relation, model and metamodel creation.
It is notably inspired by EMF dynamic instances, e.g., dynamic creation of model
properties (attributes/references setters).



# Installation

##Installation of NodeJs
This application can run in the browser. 
But it is first intended to run on NodeJs available as:
https://nodejs.org/en/ 

##Installation of Test Environment
The test framework used is Mocha:

    $ npm install -g mocha

It uses additionally the should library for testing purposes

    $ npm install should --save-dev

#Features and Todo

##Specific Features:
JSMF, tough it is a simplification, proposes additional features such as:
- different level of conformance and type checking, allowing for loosely-defined
models (see Natural Modelling).
- promotion mechanism that allows the (meta)model designers to create a 
metamodel form modelling elements
- Persistence in graph DB

We have planned to define an inference mechanism that permit to create 
metamodels elements from examples models (in other words metamodel emergence).

We currently added one feature:
- JSMF on web

# Model Transformation
JSTL: JavaScript Transformation Language, an equivalent to ATL for JSMF.

