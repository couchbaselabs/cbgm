function scheduleMoves(ctx, req) {
  return run(ctx, req,
             initPartitionModel);
}
