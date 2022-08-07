import { Card, CardContent } from "@material-ui/core";
import HorizontalSpacer from "@saleor/apps/components/HorizontalSpacer";
import { Button } from "@saleor/components/Button";
import CardTitle from "@saleor/components/CardTitle";
import { Hr } from "@saleor/components/Hr";
import Money from "@saleor/components/Money";
import Skeleton from "@saleor/components/Skeleton";
import {
  OrderAction,
  OrderDetailsFragment,
  OrderDiscountType,
  OrderStatus,
} from "@saleor/graphql";
import { makeStyles, Pill } from "@saleor/macaw-ui";
import clsx from "clsx";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { maybe, transformPaymentStatus } from "../../../misc";
import { orderPaymentMessages, paymentButtonMessages } from "./messages";
import {
  extractOrderGiftCardUsedAmount,
  extractOutstandingBalance,
  extractRefundedAmount,
} from "./utils";

const useStyles = makeStyles(
  theme => ({
    header: {
      display: "flex",
      justifyContent: "space-between",
    },
    root: {
      ...theme.typography.body1,
      lineHeight: 1.9,
      width: "100%",
      "& > div": {
        display: "flex",
        justifyContent: "flex-end",
      },
    },
    leftmostRightAlignedElement: {
      marginLeft: "auto",
    },
    rightmostLeftAlignedElement: {
      marginRight: "auto",
    },
    totalRow: {
      fontWeight: 600,
    },
    titleContainer: {
      display: "flex",
    },
    supportText: {
      color: theme.palette.saleor.main[3],
    },
  }),
  { name: "OrderPayment" },
);

interface OrderPaymentProps {
  order: OrderDetailsFragment;
  onCapture: () => void;
  onMarkAsPaid: () => void;
  onRefund: () => void;
  onVoid: () => void;
}

const OrderPayment: React.FC<OrderPaymentProps> = props => {
  const { order, onCapture, onMarkAsPaid, onRefund, onVoid } = props;
  const classes = useStyles(props);

  const intl = useIntl();

  const canCapture = maybe(() => order.actions, []).includes(
    OrderAction.CAPTURE,
  );
  const canVoid = maybe(() => order.actions, []).includes(OrderAction.VOID);
  const canRefund = maybe(() => order.actions, []).includes(OrderAction.REFUND);
  const canMarkAsPaid = maybe(() => order.actions, []).includes(
    OrderAction.MARK_AS_PAID,
  );
  const payment = transformPaymentStatus(order?.paymentStatus, intl);
  const refundedAmount = extractRefundedAmount(order);
  const outstandingBalance = extractOutstandingBalance(order);
  const usedGiftCardAmount = extractOrderGiftCardUsedAmount(order);

  const getDeliveryMethodName = order => {
    if (
      order?.shippingMethodName === undefined &&
      order?.shippingPrice === undefined &&
      order?.collectionPointName === undefined
    ) {
      return <Skeleton />;
    }

    if (order.shippingMethodName === null) {
      return order.collectionPointName == null ? (
        <FormattedMessage {...orderPaymentMessages.shippingDoesNotApply} />
      ) : (
        <FormattedMessage
          {...orderPaymentMessages.clickAndCollectShippingMethod}
        />
      );
    }
    return order.shippingMethodName;
  };

  return (
    <Card>
      <CardTitle
        title={
          !order?.paymentStatus ? (
            <Skeleton />
          ) : (
            <div className={classes.titleContainer}>
              <FormattedMessage {...orderPaymentMessages.paymentTitle} />
              <HorizontalSpacer spacing={2} />
              <Pill
                className={classes.rightmostLeftAlignedElement}
                label={payment.localized}
                color={payment.status}
              />
              {order?.status !== OrderStatus.CANCELED &&
                (canCapture || canRefund || canVoid || canMarkAsPaid) && (
                  <div>
                    {canCapture && (
                      <Button variant="tertiary" onClick={onCapture}>
                        <FormattedMessage {...paymentButtonMessages.capture} />
                      </Button>
                    )}
                    {canRefund && (
                      <Button
                        variant="tertiary"
                        onClick={onRefund}
                        data-test-id="refund-button"
                      >
                        <FormattedMessage {...paymentButtonMessages.refund} />
                      </Button>
                    )}
                    {canVoid && (
                      <Button variant="tertiary" onClick={onVoid}>
                        <FormattedMessage {...paymentButtonMessages.void} />
                      </Button>
                    )}
                    {canMarkAsPaid && (
                      <Button variant="tertiary" onClick={onMarkAsPaid}>
                        <FormattedMessage
                          {...paymentButtonMessages.markAsPaid}
                        />
                      </Button>
                    )}
                  </div>
                )}
            </div>
          )
        }
      />
      <CardContent>
        <div className={classes.root}>
          {order?.discounts?.map(discount => (
            <div>
              <FormattedMessage {...orderPaymentMessages.discount} />
              {discount.type === OrderDiscountType.MANUAL ? (
                <FormattedMessage {...orderPaymentMessages.staffAdded} />
              ) : (
                <FormattedMessage {...orderPaymentMessages.voucher} />
              )}
              <div className={classes.leftmostRightAlignedElement}>
                -<Money money={discount.amount} />
              </div>
            </div>
          ))}
          <div>
            <FormattedMessage {...orderPaymentMessages.subtotal} />
            <div className={classes.leftmostRightAlignedElement}>
              {<Money money={order?.subtotal.gross} /> ?? <Skeleton />}
            </div>
          </div>
          <div>
            <FormattedMessage {...orderPaymentMessages.shipping} />
            <HorizontalSpacer spacing={4} />
            <div className={classes.supportText}>
              {getDeliveryMethodName(order)}
            </div>
            <div className={classes.leftmostRightAlignedElement}>
              {<Money money={order?.shippingPrice.gross} /> ?? <Skeleton />}
            </div>
          </div>
          <div>
            <FormattedMessage {...orderPaymentMessages.taxes} />
            {order?.total.tax.amount > 0 && (
              <>
                <div
                  className={clsx(
                    classes.supportText,
                    classes.leftmostRightAlignedElement,
                  )}
                >
                  <FormattedMessage {...orderPaymentMessages.vatIncluded} />{" "}
                </div>
                <HorizontalSpacer spacing={4} />
              </>
            )}
            <div
              className={clsx({
                [classes.leftmostRightAlignedElement]:
                  order?.total.tax.amount === 0,
              })}
            >
              {<Money money={order?.total.tax} /> ?? <Skeleton />}
            </div>
          </div>
          <div className={classes.totalRow}>
            <FormattedMessage {...orderPaymentMessages.total} />
            <div className={classes.leftmostRightAlignedElement}>
              {<Money money={order?.total.gross} /> ?? <Skeleton />}
            </div>
          </div>
        </div>
      </CardContent>
      <Hr />
      <CardContent>
        <div className={classes.root}>
          {!!usedGiftCardAmount && (
            <div>
              <FormattedMessage {...orderPaymentMessages.paidWithGiftCard} />
              <div className={classes.leftmostRightAlignedElement}>
                <Money
                  money={{
                    amount: usedGiftCardAmount,
                    currency: order?.total?.gross?.currency,
                  }}
                />
              </div>
            </div>
          )}
          <div>
            <FormattedMessage {...orderPaymentMessages.preauthorized} />
            <div className={classes.leftmostRightAlignedElement}>
              {<Money money={order?.totalAuthorized} /> ?? <Skeleton />}
            </div>
          </div>
          <div>
            <FormattedMessage {...orderPaymentMessages.captured} />
            <div className={classes.leftmostRightAlignedElement}>
              {<Money money={order?.totalCaptured} /> ?? <Skeleton />}
            </div>
          </div>
          <div>
            <FormattedMessage {...orderPaymentMessages.refunded} />
            <div className={classes.leftmostRightAlignedElement}>
              {<Money money={refundedAmount} /> ?? <Skeleton />}
            </div>
          </div>
          <div className={classes.totalRow}>
            <FormattedMessage {...orderPaymentMessages.outstanding} />
            <div className={classes.leftmostRightAlignedElement}>
              {<Money money={outstandingBalance} /> ?? <Skeleton />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
OrderPayment.displayName = "OrderPayment";
export default OrderPayment;
