import * as React from "react";
import { Route } from "react-router-dom";

import { productTypeDetailsUrl, productTypeListUrl } from "../../";
import Messages from "../../../components/messages";
import Navigator from "../../../components/Navigator";
import i18n from "../../../i18n";
import { maybe } from "../../../misc";
import { AttributeTypeEnum } from "../../../types/globalTypes";
import ProductTypeAttributeEditDialog, {
  FormData as AttributeForm
} from "../../components/ProductTypeAttributeEditDialog";
import ProductTypeDetailsPage, {
  ProductTypeForm
} from "../../components/ProductTypeDetailsPage";
import ProductTypeOperations from "../../containers/ProductTypeOperations";
import { TypedProductTypeDetailsQuery } from "../../queries";
import { AttributeCreate } from "../../types/AttributeCreate";
import { AttributeDelete } from "../../types/AttributeDelete";
import { AttributeUpdate } from "../../types/AttributeUpdate";
import { ProductTypeDelete } from "../../types/ProductTypeDelete";
import { ProductTypeUpdate as ProductTypeUpdateMutation } from "../../types/ProductTypeUpdate";
import { addAttributeUrl, editAttributeUrl } from "./urls";

interface ProductTypeUpdateProps {
  id: string;
}

export const ProductTypeUpdate: React.StatelessComponent<
  ProductTypeUpdateProps
> = ({ id }) => (
  <Messages>
    {pushMessage => (
      <Navigator>
        {navigate => (
          <TypedProductTypeDetailsQuery variables={{ id }}>
            {({ data, loading: dataLoading }) => {
              const closeModal = () =>
                navigate(productTypeDetailsUrl(encodeURIComponent(id)), true);
              const handleAttributeCreateSuccess = (data: AttributeCreate) => {
                if (!maybe(() => data.attributeCreate.errors.length)) {
                  pushMessage({
                    text: i18n.t("Attribute created", {
                      context: "notification"
                    })
                  });
                  closeModal();
                }
              };
              const handleAttributeDeleteSuccess = (data: AttributeDelete) => {
                if (!maybe(() => data.attributeDelete.errors.length)) {
                  pushMessage({
                    text: i18n.t("Attribute deleted", {
                      context: "notification"
                    })
                  });
                }
              };
              const handleAttributeUpdateSuccess = (data: AttributeUpdate) => {
                if (!maybe(() => data.attributeUpdate.errors.length)) {
                  pushMessage({
                    text: i18n.t("Attribute updated", {
                      context: "notification"
                    })
                  });
                  closeModal();
                }
              };
              const handleProductTypeDeleteSuccess = (
                deleteData: ProductTypeDelete
              ) => {
                if (deleteData.productTypeDelete.errors.length === 0) {
                  pushMessage({
                    text: i18n.t("Product type deleted", {
                      context: "notification"
                    })
                  });
                  navigate(productTypeListUrl);
                }
              };
              const handleProductTypeUpdateSuccess = (
                updateData: ProductTypeUpdateMutation
              ) => {
                if (updateData.productTypeUpdate.errors.length === 0) {
                  pushMessage({
                    text: i18n.t("Product type updated", {
                      context: "notification"
                    })
                  });
                }
              };

              return (
                <ProductTypeOperations
                  id={id}
                  onAttributeCreate={handleAttributeCreateSuccess}
                  onAttributeDelete={handleAttributeDeleteSuccess}
                  onAttributeUpdate={handleAttributeUpdateSuccess}
                  onProductTypeDelete={handleProductTypeDeleteSuccess}
                  onProductTypeUpdate={handleProductTypeUpdateSuccess}
                >
                  {({
                    attributeCreate,
                    deleteAttribute,
                    deleteProductType,
                    loading: mutationLoading,
                    updateAttribute,
                    updateProductType
                  }) => {
                    const handleProductTypeDelete = () =>
                      deleteProductType.mutate({ id });
                    const handleProductTypeUpdate = (
                      formData: ProductTypeForm
                    ) => {
                      updateProductType.mutate({
                        id,
                        input: {
                          hasVariants: formData.hasVariants,
                          isShippingRequired: formData.isShippingRequired,
                          name: formData.name,
                          productAttributes: formData.productAttributes.map(
                            choice => choice.value
                          ),
                          taxRate: formData.taxRate,
                          variantAttributes: formData.variantAttributes.map(
                            choice => choice.value
                          ),
                          weight: formData.weight
                        }
                      });
                    };
                    const handleAttributeCreate = (
                      data: AttributeForm,
                      type: AttributeTypeEnum
                    ) =>
                      attributeCreate.mutate({
                        id,
                        input: {
                          name: data.name,
                          values: data.values.map(value => ({
                            name: value.label
                          }))
                        },
                        type
                      });
                    const handleAttributeDelete = (
                      id: string,
                      event: React.MouseEvent<any>
                    ) => {
                      event.stopPropagation();
                      deleteAttribute.mutate({ id });
                    };
                    const handleAttributeUpdate = (
                      id: string,
                      formData: AttributeForm
                    ) => {
                      const attribute = data.productType.variantAttributes
                        .concat(data.productType.productAttributes)
                        .filter(attribute => attribute.id === id)[0];
                      updateAttribute.mutate({
                        id,
                        input: {
                          addValues: formData.values
                            .filter(
                              value =>
                                !attribute.values
                                  .map(value => value.id)
                                  .includes(value.value)
                            )
                            .map(value => ({
                              name: value.label
                            })),
                          name: formData.name,
                          removeValues: attribute.values
                            .filter(
                              value =>
                                !formData.values
                                  .map(value => value.value)
                                  .includes(value.id)
                            )
                            .map(value => value.id)
                        }
                      });
                    };
                    const loading = mutationLoading || dataLoading;
                    return (
                      <>
                        <ProductTypeDetailsPage
                          defaultWeightUnit={maybe(
                            () => data.shop.defaultWeightUnit
                          )}
                          disabled={loading}
                          errors={maybe(
                            () =>
                              updateProductType.data.productTypeUpdate.errors
                          )}
                          pageTitle={maybe(() => data.productType.name)}
                          productType={maybe(() => data.productType)}
                          saveButtonBarState={loading ? "loading" : "default"}
                          onAttributeAdd={type =>
                            navigate(
                              addAttributeUrl(encodeURIComponent(id), type)
                            )
                          }
                          onAttributeDelete={handleAttributeDelete}
                          onAttributeUpdate={attributeId =>
                            navigate(
                              editAttributeUrl(
                                encodeURIComponent(id),
                                encodeURIComponent(attributeId)
                              )
                            )
                          }
                          onBack={() => navigate(productTypeListUrl)}
                          onDelete={handleProductTypeDelete}
                          onSubmit={handleProductTypeUpdate}
                        />
                        {!dataLoading && (
                          <>
                            {Object.keys(AttributeTypeEnum).map(key => (
                              <Route
                                exact
                                path={addAttributeUrl(
                                  encodeURIComponent(id),
                                  AttributeTypeEnum[key]
                                )}
                                key={key}
                              >
                                {({ match }) => (
                                  <ProductTypeAttributeEditDialog
                                    disabled={attributeCreate.loading}
                                    errors={maybe(
                                      () =>
                                        attributeCreate.data.attributeCreate
                                          .errors
                                    )}
                                    name=""
                                    values={[]}
                                    onClose={closeModal}
                                    onConfirm={data =>
                                      handleAttributeCreate(
                                        data,
                                        AttributeTypeEnum[key]
                                      )
                                    }
                                    opened={!!match}
                                    title={i18n.t("Add Attribute", {
                                      context: "modal title"
                                    })}
                                  />
                                )}
                              </Route>
                            ))}
                            <Route
                              exact
                              path={editAttributeUrl(
                                encodeURIComponent(id),
                                ":id"
                              )}
                            >
                              {({ match }) => {
                                const attribute = maybe(
                                  () =>
                                    data.productType.productAttributes
                                      .concat(
                                        data.productType.variantAttributes
                                      )
                                      .filter(
                                        attribute =>
                                          attribute.id ===
                                          decodeURIComponent(match.params.id)
                                      )[0]
                                );
                                return (
                                  <ProductTypeAttributeEditDialog
                                    disabled={updateAttribute.loading}
                                    errors={maybe(
                                      () =>
                                        updateAttribute.data.attributeUpdate
                                          .errors
                                    )}
                                    name={maybe(() => attribute.name)}
                                    values={maybe(() =>
                                      attribute.values.map(value => ({
                                        label: value.name,
                                        value: value.id
                                      }))
                                    )}
                                    onClose={closeModal}
                                    onConfirm={data =>
                                      handleAttributeUpdate(
                                        decodeURIComponent(match.params.id),
                                        data
                                      )
                                    }
                                    opened={!!match}
                                    title={i18n.t("Edit Attribute", {
                                      context: "modal title"
                                    })}
                                  />
                                );
                              }}
                            </Route>
                          </>
                        )}
                      </>
                    );
                  }}
                </ProductTypeOperations>
              );
            }}
          </TypedProductTypeDetailsQuery>
        )}
      </Navigator>
    )}
  </Messages>
);
export default ProductTypeUpdate;